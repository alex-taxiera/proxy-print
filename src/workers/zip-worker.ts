import JSZip from "jszip";

type MessageEventData = {
  imageData: Array<{ name: string; image: File | Blob }>;
};

self.onmessage = async function (
  e: MessageEvent<{ type: string; data?: MessageEventData }>,
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

  // Add each image to the zip
  for (const card of imageData) {
    zip.file(card.name, card.image);
  }

  // Generate the zip as a Blob
  const zipBlob = await zip.generateAsync({ type: "blob" });
  // Send the zip blob back to main thread
  self.postMessage({ type: "zip", data: { blob: zipBlob } });
};
