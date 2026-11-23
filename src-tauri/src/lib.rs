mod mpcfill;

use tauri::Manager;

/// Which window chrome the page should draw. macOS keeps its native traffic
/// lights over the page's header; everywhere else the page draws the whole bar.
const WINDOW_FRAME: &str = if cfg!(target_os = "macos") {
    "mac"
} else {
    "custom"
};

/// Builds the main window from tauri.conf.json (which sets `create: false`) so
/// decorations can differ per platform and the page can learn which it got.
fn open_main_window(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let config = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == "main")
        .ok_or("tauri.conf.json has no main window")?;

    tauri::WebviewWindowBuilder::from_config(app.handle(), config)?
        .decorations(cfg!(target_os = "macos"))
        .initialization_script(format!(
            "Object.defineProperty(window, \"__PMP_WINDOW_FRAME__\", {{ value: \"{WINDOW_FRAME}\" }});"
        ))
        .build()?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;
            }

            let version = app.package_info().version.to_string();
            app.manage(mpcfill::MpcFillClient::new(&version)?);

            open_main_window(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![mpcfill::mpcfill_request])
        .run(tauri::generate_context!())
        .expect("error while running Print My Proxy");
}
