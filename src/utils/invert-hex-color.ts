/**
 * Inverts a hex color code.
 * @param {string} hex - The hex color code (e.g., "#ffffff" or "ffffff").
 * @returns {string} - The inverted hex color code (e.g., "#000000").
 */
export function invertHexColor(hex: string): string {
  // Remove the hash (#) if present
  hex = hex.replace(/^#/, "");

  // Ensure the hex code is valid (3 or 6 characters)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hex.length !== 6) {
    throw new Error("Invalid hex color code");
  }

  // Invert the color
  const invertedColor = hex
    .match(/.{2}/g) // Split into pairs of two characters
    ?.map((pair) => (255 - parseInt(pair, 16)).toString(16).padStart(2, "0")) // Invert and pad
    .join("");

  if (!invertedColor) {
    throw new Error("Invalid hex color code");
  }

  return `#${invertedColor}`;
}
