import JSZip from "jszip";

type MessageEventData =
  | {
      imageData: Array<{ name: string } & ({ file: File } | { url: string })>;
    }
  | undefined;

self.onmessage = async function (
  e: MessageEvent<{ type: string; data: MessageEventData }>,
) {
  const { type, data } = e.data;
  if (type !== "zip") {
    return;
  }

  if (!Array.isArray(data?.imageData)) {
    self.postMessage({ error: "No imageUrls array provided" });
    return;
  }

  const { imageData } = data;

  const zip = new JSZip();

  // Helper to fetch blob from url
  async function fetchBlob(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return await response.blob();
  }

  // Add each image to the zip
  for (const data of imageData) {
    console.log("data", data);
    if ("file" in data) {
      zip.file(data.name, data.file);
    } else {
      zip.file(data.name, fetchBlob(data.url));
    }
  }

  console.log("zip", zip);

  // Generate the zip as a Blob
  const zipBlob = await zip.generateAsync({ type: "blob" });
  // Send the zip blob back to main thread
  self.postMessage({ type: "zip", data: { blob: zipBlob } });
};
