// Minimal, dependency-free ASCII DXF (R12) writer. Only supports the entity
// types this app needs (LINE, ARC) — not a general-purpose DXF library.
// Coordinates are in whatever unit the caller uses (this app always feeds mm,
// declared via $INSUNITS in the header).

export type DxfLineEntity = {
  type: "LINE";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** AutoCAD Color Index; 1 = red */
  color?: number;
};

export type DxfArcEntity = {
  type: "ARC";
  cx: number;
  cy: number;
  radius: number;
  /** Degrees, standard DXF convention: CCW from +X axis */
  startAngle: number;
  endAngle: number;
  /** AutoCAD Color Index; 1 = red */
  color?: number;
};

export type DxfEntity = DxfLineEntity | DxfArcEntity;

const DEFAULT_LAYER = "0";

function formatNum(n: number): string {
  // Round to avoid floating point noise while keeping mm-scale precision.
  return (Math.round(n * 1e6) / 1e6).toString();
}

function entityHeader(type: string, color: number | undefined): string[] {
  const lines = ["0", type, "8", DEFAULT_LAYER];
  if (color !== undefined) {
    lines.push("62", color.toString());
  }
  return lines;
}

function serializeEntity(entity: DxfEntity): string[] {
  if (entity.type === "LINE") {
    return [
      ...entityHeader("LINE", entity.color),
      "10",
      formatNum(entity.x1),
      "20",
      formatNum(entity.y1),
      "30",
      "0.0",
      "11",
      formatNum(entity.x2),
      "21",
      formatNum(entity.y2),
      "31",
      "0.0",
    ];
  }

  return [
    ...entityHeader("ARC", entity.color),
    "10",
    formatNum(entity.cx),
    "20",
    formatNum(entity.cy),
    "30",
    "0.0",
    "40",
    formatNum(entity.radius),
    "50",
    formatNum(entity.startAngle),
    "51",
    formatNum(entity.endAngle),
  ];
}

/** $INSUNITS code for millimeters */
const INSUNITS_MILLIMETERS = 4;

export function buildDxfDocument(entities: DxfEntity[]): string {
  const lines: string[] = [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$ACADVER",
    "1",
    "AC1009",
    "9",
    "$INSUNITS",
    "70",
    INSUNITS_MILLIMETERS.toString(),
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    ...entities.flatMap(serializeEntity),
    "0",
    "ENDSEC",
    "0",
    "EOF",
  ];

  return lines.join("\n");
}
