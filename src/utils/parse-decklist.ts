// Types for parsed deck list items
export interface ParsedCard {
  quantity: number;
  name: string;
  setCode?: string;
  cardNumber?: string;
  isFoil?: boolean;
  originalLine: string;
}

export interface ParsedDecklist {
  cards: ParsedCard[];
  totalCards: number;
  errors: string[];
}

/**
 * Parses a deck list text and combines duplicate cards
 * Handles various input formats including set codes, card numbers, and foil indicators
 * If no quantity is specified, assumes quantity is 1
 */
export const parseDecklist = (decklistText: string): ParsedDecklist => {
  const lines = decklistText.trim().split("\n");
  const cardMap = new Map<string, ParsedCard>();
  const errors: string[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    try {
      // Parse the line: "1 Red Dragon" or "1 Red Dragon (SET) 123" or "1 Red Dragon (SET) 123★ *F*"
      // Also handles: "Red Dragon" or "Red Dragon (SET) 123" (assumes quantity 1)
      // Use a more robust parsing approach
      const parts = trimmedLine.split(/\s+/);
      if (parts.length < 1) {
        errors.push(`Line ${lineIndex + 1}: Invalid format - "${trimmedLine}"`);
        return;
      }

      // Check if first part is a quantity (number) or card name
      const firstPart = parts[0];
      let quantity: number;
      let remainingParts: string[];

      // Try to parse first part as quantity
      const parsedQuantity = parseInt(firstPart.replace(/x$/i, ""), 10);

      if (!isNaN(parsedQuantity)) {
        if (parsedQuantity > 0) {
          // First part is a valid positive quantity
          quantity = parsedQuantity;
          remainingParts = parts.slice(1);
        } else {
          // First part is 0 or negative, which is invalid
          errors.push(
            `Line ${lineIndex + 1}: Invalid quantity - "${firstPart}"`,
          );
          return;
        }
      } else {
        // First part is not a number, assume quantity is 1
        quantity = 1;
        remainingParts = parts;
      }

      // Find the set code and card number
      let setCode: string | undefined;
      let cardNumber: string | undefined;
      let cardNameParts: string[] = [];

      for (let i = 0; i < remainingParts.length; i++) {
        const part = remainingParts[i];

        // Check if this is a set code (3-4 letters in parentheses)
        if (
          part.startsWith("(") &&
          part.endsWith(")") &&
          part.length >= 4 &&
          part.length <= 6
        ) {
          setCode = part.slice(1, -1);
          // Next part might be card number
          if (i + 1 < remainingParts.length) {
            cardNumber = remainingParts[i + 1];
          }
          break;
        }

        cardNameParts.push(part);
      }

      // If no set code found, everything after quantity is the card name
      if (!setCode) {
        cardNameParts = remainingParts;
      }

      const cardName = cardNameParts.join(" ");

      // Quantity is already parsed above, no need to parse again

      // Clean up card name
      const cleanName = cardName.trim();
      if (!cleanName) {
        errors.push(`Line ${lineIndex + 1}: Missing card name`);
        return;
      }

      // Handle // separator - extract only the first name
      const cleanNameWithoutSeparator = cleanName.split(" // ")[0].trim();

      // Parse extra info for foil indicators - look for foil indicators in the entire line
      const isFoil = /[*★]F[*★]|\*F\*/.test(trimmedLine);

      // Clean up card name by removing foil indicators
      const cleanNameWithoutFoil = cleanNameWithoutSeparator
        .replace(/[*★]F[*★]|\*F\*/g, "")
        .trim();

      // Create a unique key for the card (excluding foil status for combining)
      // This allows us to combine cards with the same name, set, and number regardless of foil status
      const cardKey = `${cleanNameWithoutFoil}|${setCode || ""}|${cardNumber || ""}`;

      if (cardMap.has(cardKey)) {
        // Combine with existing card
        const existing = cardMap.get(cardKey)!;
        existing.quantity += quantity;
        // Keep foil status if either is foil
        existing.isFoil = existing.isFoil || isFoil;
        // Update original line to reflect the combined state
        existing.originalLine = `${existing.originalLine} + ${trimmedLine}`;
      } else {
        // Add new card
        cardMap.set(cardKey, {
          quantity,
          name: cleanNameWithoutFoil,
          setCode: setCode || undefined,
          cardNumber: cardNumber || undefined,
          isFoil,
          originalLine: trimmedLine,
        });
      }
    } catch {
      errors.push(`Line ${lineIndex + 1}: Parsing error - "${trimmedLine}"`);
    }
  });

  // Convert map to array, maintaining input order by using the first occurrence of each card
  const cards = Array.from(cardMap.values());

  // Calculate total cards
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);

  return {
    cards,
    totalCards,
    errors,
  };
};
