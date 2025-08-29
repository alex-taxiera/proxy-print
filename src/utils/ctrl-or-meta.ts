import { getOS } from "./get-os";

export function ctrlOrMeta(event: React.MouseEvent | React.KeyboardEvent) {
  const os = getOS();
  if (os === "macos") {
    return event.metaKey;
  }

  return event.ctrlKey;
}
