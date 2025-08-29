import { getOS } from "./get-os";

export function getKeybindLabels() {
  const os = getOS();

  if (os === "macos") {
    return {
      ctrl: "⌘",
      alt: "⌥",
    };
  }
  return {
    ctrl: "Ctrl",
    alt: "Alt",
  };
}
