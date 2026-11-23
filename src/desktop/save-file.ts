import * as Sentry from "@sentry/react";

/**
 * Save dialogs are shown one at a time: a multi-part PDF export hands over
 * several files in a row, and stacked native dialogs are unusable.
 */
let queue: Promise<unknown> = Promise.resolve();

const saveNow = async (blob: Blob, fileName: string) => {
  const [{ save }, { writeFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);

  const extension = /\.([a-z0-9]+)$/i.exec(fileName)?.[1];
  const path = await save({
    defaultPath: fileName,
    filters: extension
      ? [{ name: extension.toUpperCase(), extensions: [extension] }]
      : undefined,
  });
  if (!path) {
    return false;
  }

  await Sentry.startSpan(
    {
      name: "desktop.save-file",
      op: "file.write",
      attributes: { "file.size": blob.size, "file.extension": extension },
    },
    async () => writeFile(path, new Uint8Array(await blob.arrayBuffer())),
  );
  return true;
};

/**
 * The desktop stand-in for a browser download: asks where to save, then writes
 * the file there. Resolves to false when the user cancels the dialog.
 */
export const saveBlobToDisk = (blob: Blob, fileName: string) => {
  const result = queue.then(() => saveNow(blob, fileName));
  queue = result.catch(() => undefined);
  return result;
};
