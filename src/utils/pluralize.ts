/**
 * Simple pluralization utility that handles basic English pluralization rules.
 * Uses the pluralize package for more complex cases if needed.
 */

/**
 * Formats a count with its corresponding singular or plural noun.
 *
 * @param count - The number to display
 * @param singular - The singular form of the noun
 * @param plural - The plural form of the noun (optional, will add 's' to singular if not provided)
 * @returns Formatted string like "1 item" or "5 items"
 *
 * @example
 * formatCount(1, "card") // "1 card"
 * formatCount(5, "card") // "5 cards"
 * formatCount(1, "category", "categories") // "1 category"
 * formatCount(3, "category", "categories") // "3 categories"
 */
export function formatCount(
  count: number,
  singular: string,
  plural?: string,
): string {
  const noun = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${noun}`;
}

/**
 * Returns the appropriate noun form based on count.
 *
 * @param count - The number to check
 * @param singular - The singular form of the noun
 * @param plural - The plural form of the noun (optional, will add 's' to singular if not provided)
 * @returns The appropriate noun form
 *
 * @example
 * pluralize(1, "card") // "card"
 * pluralize(5, "card") // "cards"
 * pluralize(1, "category", "categories") // "category"
 * pluralize(3, "category", "categories") // "categories"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Formats a selection count message.
 *
 * @param count - The number of selected items
 * @param itemType - The type of item (e.g., "card", "image")
 * @returns Formatted string like "1 selected card" or "5 selected cards"
 */
export function formatSelectionCount(count: number, itemType: string): string {
  return formatCount(count, `selected ${itemType}`);
}
