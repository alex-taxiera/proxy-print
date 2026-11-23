//! The one outside HTTP surface the page gets: a fixed set of MPC Autofill API
//! routes on a backend the user chose. The MPC Autofill API sends no CORS
//! headers for app origins, so the webview cannot call it itself.
//!
//! This is deliberately not a general proxy: the page picks an endpoint from
//! [`MpcFillEndpoint`], never a path, and the backend must be https (or http on
//! loopback, for a self-hosted backend).

use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use url::{Host, Url};

/// MPC Autofill's `/2/cards/` answers with up to 1000 cards; this is far above
/// any real response and only stops a misbehaving server filling memory.
const MAX_RESPONSE_BYTES: usize = 32 * 1024 * 1024;

pub struct MpcFillClient(reqwest::Client);

impl MpcFillClient {
    pub fn new(app_version: &str) -> Result<Self, reqwest::Error> {
        reqwest::Client::builder()
            .user_agent(format!("PrintMyProxy/{app_version}"))
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .redirect(reqwest::redirect::Policy::limited(3))
            .build()
            .map(Self)
    }
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MpcFillEndpoint {
    Sources,
    SearchEngineHealth,
    EditorSearchV3,
    EditorSearchV2,
    Cards,
}

impl MpcFillEndpoint {
    fn route(self) -> (reqwest::Method, &'static str) {
        match self {
            Self::Sources => (reqwest::Method::GET, "/2/sources/"),
            Self::SearchEngineHealth => (reqwest::Method::GET, "/2/searchEngineHealth/"),
            Self::EditorSearchV3 => (reqwest::Method::POST, "/3/editorSearch/"),
            Self::EditorSearchV2 => (reqwest::Method::POST, "/2/editorSearch/"),
            Self::Cards => (reqwest::Method::POST, "/2/cards/"),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct MpcFillError {
    /// The HTTP status, when the backend answered at all.
    status: Option<u16>,
    message: String,
}

impl MpcFillError {
    fn new(message: impl Into<String>) -> Self {
        Self {
            status: None,
            message: message.into(),
        }
    }
}

/// Reduces what the user typed to the backend's origin. MPC Autofill backends
/// live at the root of their host, so any path, query or fragment is dropped.
fn backend_origin(base_url: &str) -> Result<Url, String> {
    let mut url = Url::parse(base_url.trim()).map_err(|_| "That isn't a valid URL.")?;

    let is_loopback = match url.host() {
        Some(Host::Domain(domain)) => domain == "localhost",
        Some(Host::Ipv4(address)) => address.is_loopback(),
        Some(Host::Ipv6(address)) => address.is_loopback(),
        None => return Err("The server URL needs a host.".into()),
    };

    match url.scheme() {
        "https" => {}
        "http" if is_loopback => {}
        _ => return Err("The server URL must use https.".into()),
    }

    if !url.username().is_empty() || url.password().is_some() {
        return Err("The server URL can't contain a username or password.".into());
    }

    url.set_path("/");
    url.set_query(None);
    url.set_fragment(None);
    Ok(url)
}

/// The message MPC Autofill puts in an error body, if this is one.
fn backend_message(body: &[u8]) -> Option<String> {
    let value: Value = serde_json::from_slice(body).ok()?;
    let name = value.get("name")?.as_str()?;
    Some(match value.get("message").and_then(Value::as_str) {
        Some(message) => format!("{name}: {message}"),
        None => name.to_owned(),
    })
}

async fn read_capped(mut response: reqwest::Response) -> Result<Vec<u8>, MpcFillError> {
    let mut body = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|error| MpcFillError::new(format!("The server's reply was cut off: {error}")))?
    {
        if body.len() + chunk.len() > MAX_RESPONSE_BYTES {
            return Err(MpcFillError::new("The server's reply was too large."));
        }
        body.extend_from_slice(&chunk);
    }
    Ok(body)
}

#[tauri::command]
pub async fn mpcfill_request(
    client: tauri::State<'_, MpcFillClient>,
    base_url: String,
    endpoint: MpcFillEndpoint,
    body: Option<Value>,
) -> Result<Value, MpcFillError> {
    let origin = backend_origin(&base_url).map_err(MpcFillError::new)?;
    let (method, path) = endpoint.route();
    let url = origin
        .join(path)
        .map_err(|_| MpcFillError::new("That isn't a valid URL."))?;

    let mut request = client.0.request(method.clone(), url);
    if method == reqwest::Method::POST {
        request = request.json(&body.unwrap_or(Value::Null));
    }

    let response = request.send().await.map_err(|error| {
        MpcFillError::new(if error.is_timeout() {
            "The server took too long to answer.".to_owned()
        } else if error.is_connect() {
            "Couldn't reach the server.".to_owned()
        } else {
            format!("The request failed: {}", error.without_url())
        })
    })?;

    let status = response.status();
    let bytes = read_capped(response).await?;

    if !status.is_success() {
        return Err(MpcFillError {
            status: Some(status.as_u16()),
            message: backend_message(&bytes)
                .unwrap_or_else(|| format!("The server answered {status}.")),
        });
    }

    serde_json::from_slice(&bytes).map_err(|_| MpcFillError {
        status: Some(status.as_u16()),
        message: "The server's reply wasn't JSON. Is this an MPC Autofill server?".to_owned(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_only_the_origin() {
        let origin = backend_origin(" https://mpcfill.com/editor?x=1#top ").unwrap();
        assert_eq!(origin.as_str(), "https://mpcfill.com/");
    }

    #[test]
    fn allows_http_only_on_loopback() {
        assert!(backend_origin("http://localhost:8000").is_ok());
        assert!(backend_origin("http://127.0.0.1:8000").is_ok());
        assert!(backend_origin("http://[::1]:8000").is_ok());
        assert!(backend_origin("http://mpcfill.com").is_err());
        assert!(backend_origin("http://192.168.1.10:8000").is_err());
    }

    #[test]
    fn rejects_other_schemes_and_credentials() {
        assert!(backend_origin("file:///etc/passwd").is_err());
        assert!(backend_origin("ftp://mpcfill.com").is_err());
        assert!(backend_origin("https://user:pass@mpcfill.com").is_err());
        assert!(backend_origin("not a url").is_err());
    }

    #[test]
    fn routes_are_fixed() {
        let (method, path) = MpcFillEndpoint::EditorSearchV2.route();
        assert_eq!(method, reqwest::Method::POST);
        assert_eq!(path, "/2/editorSearch/");
        let endpoint: MpcFillEndpoint = serde_json::from_str("\"searchEngineHealth\"").unwrap();
        assert_eq!(endpoint.route().1, "/2/searchEngineHealth/");
    }

    #[test]
    fn reads_backend_error_messages() {
        let body = br#"{"name":"Schema error/s","message":"See `errors` field."}"#;
        assert_eq!(
            backend_message(body).as_deref(),
            Some("Schema error/s: See `errors` field.")
        );
        assert_eq!(backend_message(b"<html>404</html>"), None);
    }
}
