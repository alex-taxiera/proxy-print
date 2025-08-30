import { describe, expect, it } from "vitest";

import { parseDecklist } from "~/utils/parse-decklist";

describe("parseDecklist", () => {
  describe("basic parsing", () => {
    it("should parse a simple single card", () => {
      const input = "1 Red Dragon";
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(1);
      expect(result.totalCards).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.cards[0]).toEqual({
        quantity: 1,
        name: "Red Dragon",
        setCode: undefined,
        cardNumber: undefined,
        isFoil: false,
        originalLine: "1 Red Dragon",
      });
    });

    it("should parse multiple simple cards", () => {
      const input = `1 Red Dragon
2 Blue Elemental
3 Green Goblin`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(3);
      expect(result.totalCards).toBe(6);
      expect(result.errors).toHaveLength(0);
      // Cards maintain input order
      expect(result.cards.map((c) => c.name)).toEqual([
        "Red Dragon",
        "Blue Elemental",
        "Green Goblin",
      ]);
    });

    it("should handle empty input", () => {
      const input = "";
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(0);
      expect(result.totalCards).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle whitespace-only input", () => {
      const input = "   \n  \n  ";
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(0);
      expect(result.totalCards).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("quantity parsing", () => {
    it("should parse basic quantities", () => {
      const input = `1 Red Dragon
10 Blue Elemental
100 Green Goblin`;
      const result = parseDecklist(input);

      // Cards maintain input order
      expect(result.cards[0].quantity).toBe(1); // Red Dragon
      expect(result.cards[1].quantity).toBe(10); // Blue Elemental
      expect(result.cards[2].quantity).toBe(100); // Green Goblin
    });

    it("should handle 'x' notation", () => {
      const input = `1x Red Dragon
10x Blue Elemental
100x Green Goblin`;
      const result = parseDecklist(input);

      // Cards maintain input order
      expect(result.cards[0].quantity).toBe(1); // Red Dragon
      expect(result.cards[1].quantity).toBe(10); // Blue Elemental
      expect(result.cards[2].quantity).toBe(100); // Green Goblin
    });

    it("should handle mixed notation", () => {
      const input = `1 Red Dragon
2x Blue Elemental
3 Green Goblin`;
      const result = parseDecklist(input);

      // Cards maintain input order
      expect(result.cards[0].quantity).toBe(1); // Red Dragon
      expect(result.cards[1].quantity).toBe(2); // Blue Elemental
      expect(result.cards[2].quantity).toBe(3); // Green Goblin
    });

    it("should reject invalid quantities", () => {
      const input = `0 Red Dragon
-1 Blue Elemental`;
      const result = parseDecklist(input);

      expect(result.errors).toHaveLength(2);
      expect(result.cards).toHaveLength(0);
      expect(result.totalCards).toBe(0);
    });

    it("should handle cards without quantities (assume quantity 1)", () => {
      const input = `Sol Ring (PIP)
2 Lightning Bolt
Counterspell`;
      const result = parseDecklist(input);

      expect(result.errors).toHaveLength(0);
      expect(result.cards).toHaveLength(3);
      expect(result.totalCards).toBe(4);

      const solRing = result.cards.find((c) => c.name === "Sol Ring");
      const lightningBolt = result.cards.find(
        (c) => c.name === "Lightning Bolt",
      );
      const counterspell = result.cards.find((c) => c.name === "Counterspell");

      expect(solRing?.quantity).toBe(1);
      expect(solRing?.setCode).toBe("PIP");
      expect(lightningBolt?.quantity).toBe(2);
      expect(counterspell?.quantity).toBe(1);
    });
  });

  describe("set code and card number parsing", () => {
    it("should parse set codes in parentheses", () => {
      const input = "1 Red Dragon (DMC)";
      const result = parseDecklist(input);

      expect(result.cards[0].setCode).toBe("DMC");
      expect(result.cards[0].cardNumber).toBeUndefined();
    });

    it("should parse set codes and card numbers", () => {
      const input = "1 Red Dragon (DMC) 36";
      const result = parseDecklist(input);

      expect(result.cards[0].setCode).toBe("DMC");
      expect(result.cards[0].cardNumber).toBe("36");
    });

    it("should parse complex card numbers", () => {
      const input = "1 Basilisk Collar (PLST) MM3-216";
      const result = parseDecklist(input);

      expect(result.cards[0].setCode).toBe("PLST");
      expect(result.cards[0].cardNumber).toBe("MM3-216");
    });

    it("should parse cards with special characters in set codes", () => {
      const input = "1 Temple Garden (PGRN) 258p";
      const result = parseDecklist(input);

      expect(result.cards[0].setCode).toBe("PGRN");
      expect(result.cards[0].cardNumber).toBe("258p");
    });
  });

  describe("foil detection", () => {
    it("should detect foil indicators", () => {
      const input = "1 Beast Whisperer (PGRN) 123★ *F*";
      const result = parseDecklist(input);

      expect(result.cards[0].isFoil).toBe(true);
    });

    it("should detect various foil formats", () => {
      const input = `1 Card1 *F*
1 Card2 ★F★
1 Card3 *F*
1 Card4 ★F★`;
      const result = parseDecklist(input);

      result.cards.forEach((card) => {
        expect(card.isFoil).toBe(true);
      });
    });

    it("should not detect foil for normal cards", () => {
      const input = "1 Red Dragon (DMC) 36";
      const result = parseDecklist(input);

      expect(result.cards[0].isFoil).toBe(false);
    });
  });

  describe("duplicate handling", () => {
    it("should combine identical cards", () => {
      const input = `1 Red Dragon
1 Red Dragon
1 Red Dragon`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].quantity).toBe(3);
      expect(result.totalCards).toBe(3);
    });

    it("should combine cards with same name but different foil status", () => {
      const input = `1 Red Dragon
1 Red Dragon *F*`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].quantity).toBe(2);
      expect(result.cards[0].isFoil).toBe(true);
    });

    it("should not combine cards with different set codes", () => {
      const input = `1 Red Dragon (DMC) 36
1 Red Dragon (ABC) 42`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(2);
      expect(result.totalCards).toBe(2);
    });

    it("should not combine cards with different card numbers", () => {
      const input = `1 Red Dragon (DMC) 36
1 Red Dragon (DMC) 42`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(2);
      expect(result.totalCards).toBe(2);
    });

    it("should combine cards with same name, set, and number but different foil status", () => {
      const input = `1 Red Dragon (DMC) 36
1 Red Dragon (DMC) 36 *F*`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].quantity).toBe(2);
      expect(result.cards[0].isFoil).toBe(true);
    });
  });

  describe("complex real-world examples", () => {
    it("should parse the complex decklist from the user", () => {
      const input = `1 Ohabi Caleria (DMC) 36
1 Arcane Signet (BLC) 127
1 Archery Training (UDS) 2
1 Austere Command (MKC) 56
1 Banner of Kinship (FDN) 127
1 Basilisk Collar (PLST) MM3-216
1 Beast Whisperer (PGRN) 123★ *F*
1 Beast Within (EOC) 93
1 Blossoming Sands (EMA) 237
1 Bountiful Promenade (CLB) 348
1 Bow of Nylea (THS) 153
1 Brave the Sands (KTK) 5
1 Brigid, Hero of Kinsbaile (LRW) 6
1 Canopy Vista (PIP) 255
1 Cavern of Souls (LCI) 345
1 Citanul Hierophants (SCD) 175
1 Command Tower (SCD) 297
1 Coordinated Barrage (MOR) 7
1 Crossbow Infantry (PLST) MMQ-16
1 Cryptolith Rite (INR) 408
1 Cultivate (EOC) 95
1 D'Avenant Archer (CHR) 5
1 D'Avenant Healer (TSP) 11
1 Elven Chorus (LTR) 160
1 Enduring Vitality (DSK) 176
1 Ezuri's Archers (PLST) DDU-9
1 Femeref Archers (10E) 264
1 Flawless Maneuver (ONC) 68
1 Folk Hero (CLB) 650 *F*
14 Forest (HOU) 198
1 Fortified Village (FIC) 396
1 Generous Gift (PLST) MH1-11
1 Gift of the Viper (MH3) 156
1 Glare of Subdual (GK1) 112
1 Greatbow Doyen (MOR) 125
1 Hail of Arrows (CN2) 90
1 Halana, Kessig Ranger (CMR) 231
1 Hankyu (CHK) 253
1 Harvest Season (AKH) 170
1 Heart-Piercer Bow (CMM) 390
1 Herald's Horn (MB1) 1593
1 Heroic Intervention (WHO) 233
1 Hunter's Bow (ACR) 41
1 Hushwood Verge (DSK) 261
1 Legolas Greenleaf (LTC) 40
1 Legolas's Quick Reflexes (LTC) 493
1 Matsu-Tribe Sniper (BOK) 136
1 Nature's Lore (EOC) 101
1 Nullmage Shepherd (SCD) 200
1 Overgrown Farmland (WHO) 292
1 Palazzo Archers (ACR) 42
1 Patchwork Banner (BLB) 247
1 Path of Ancestry (PIP) 279
1 Path to Exile (MKC) 78
1 Pathway Arrows (BFZ) 225
8 Plains (PLST) WOE-267
1 Quest for Renewal (WWK) 110
1 Quietus Spike (BRR) 109
1 Rampant Growth (PLST) MIR-235
1 Realmwalker (KHM) 188
1 Reliquary Tower (C15) 301
1 Saryth, the Viper's Fang (MKC) 185
1 Scattershot Archer (CON) 90
1 Secluded Courtyard (FDN) 267
1 Shower of Arrows (LTR) 188
1 Silhana Starfletcher (GPT) 95
1 Sol Ring (EOC) 57
1 Strength of the Harvest // Haven of the Harvest (MH3) 258
1 Sunpetal Grove (FIC) 432
1 Swiftfoot Boots (FDN) 258
1 Swords to Plowshares (EOC) 45
1 Tadeas, Juniper Ascendant (SLX) 16
1 Temple Garden (PGRN) 258p
1 Temple of Plenty (WHO) 319
1 To Arms! (RVR) 30
1 Trostani, Three Whispers (MKM) 238
1 Vanquisher's Banner (XLN) 251
1 Viridian Longbow (PLST) AFC-221
1 Well Rested (PIP) 88
1 Wilderness Reclamation (MKC) 196`;

      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(80); // Unique cards (corrected expectation)
      expect(result.totalCards).toBe(100); // Total count including duplicates (corrected expectation)
      expect(result.errors).toHaveLength(0);

      // Check that Forest and Plains were combined correctly
      const forest = result.cards.find((c) => c.name === "Forest");
      const plains = result.cards.find((c) => c.name === "Plains");

      expect(forest?.quantity).toBe(14);
      expect(plains?.quantity).toBe(8);

      // Check foil detection
      const beastWhisperer = result.cards.find(
        (c) => c.name === "Beast Whisperer",
      );
      const folkHero = result.cards.find((c) => c.name === "Folk Hero");

      expect(beastWhisperer?.isFoil).toBe(true);
      expect(folkHero?.isFoil).toBe(true);

      // Check set codes and card numbers
      const basiliskCollar = result.cards.find(
        (c) => c.name === "Basilisk Collar",
      );
      expect(basiliskCollar?.setCode).toBe("PLST");
      expect(basiliskCollar?.cardNumber).toBe("MM3-216");
    });

    it("should handle cards with special characters in names", () => {
      const input = `1 D'Avenant Archer (CHR) 5
1 Strength of the Harvest // Haven of the Harvest (MH3) 258`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].name).toBe("D'Avenant Archer");
      expect(result.cards[1].name).toBe("Strength of the Harvest");
    });

    it("should extract only the first name when card has // separator", () => {
      const input =
        "1 Strength of the Harvest // Haven of the Harvest (MH3) 258";
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].name).toBe("Strength of the Harvest");
      expect(result.cards[0].setCode).toBe("MH3");
      expect(result.cards[0].cardNumber).toBe("258");
      expect(result.cards[0].quantity).toBe(1);
    });
  });

  describe("error handling", () => {
    it("should handle malformed lines", () => {
      const input = `1 Red Dragon
Invalid line
2 Blue Elemental
Another invalid line`;
      const result = parseDecklist(input);

      // With the new behavior, "Invalid line" and "Another invalid line" are treated as cards with quantity 1
      expect(result.errors).toHaveLength(0);
      expect(result.cards).toHaveLength(4);
      expect(result.totalCards).toBe(5);

      // Check that the malformed lines are treated as cards
      const invalidLine = result.cards.find((c) => c.name === "Invalid line");
      const anotherInvalidLine = result.cards.find(
        (c) => c.name === "Another invalid line",
      );
      expect(invalidLine?.quantity).toBe(1);
      expect(anotherInvalidLine?.quantity).toBe(1);
    });

    it("should handle lines with missing card names", () => {
      const input = "1";
      const result = parseDecklist(input);

      expect(result.errors).toHaveLength(1);
      expect(result.cards).toHaveLength(0);
    });

    it("should handle lines with only whitespace", () => {
      const input = `1 Red Dragon

2 Blue Elemental`;
      const result = parseDecklist(input);

      expect(result.cards).toHaveLength(2);
      expect(result.totalCards).toBe(3);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("input order preservation", () => {
    it("should maintain input order", () => {
      const input = `1 Zebra
1 Apple
1 Banana`;
      const result = parseDecklist(input);

      // Cards maintain input order
      expect(result.cards.map((c) => c.name)).toEqual([
        "Zebra",
        "Apple",
        "Banana",
      ]);
    });

    it("should maintain input order after combining duplicates", () => {
      const input = `1 Zebra
1 Apple
1 Apple
1 Banana`;
      const result = parseDecklist(input);

      // Cards maintain input order, duplicates are combined
      expect(result.cards.map((c) => c.name)).toEqual([
        "Zebra",
        "Apple",
        "Banana",
      ]);
      expect(result.cards[1].quantity).toBe(2); // Apple is at index 1
    });
  });
});
