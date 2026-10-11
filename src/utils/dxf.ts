// Minimal, dependency-free ASCII DXF writer. Only supports the entity type
// this app needs (closed POLYLINE) — not a general-purpose DXF library.
// Coordinates are in whatever unit the caller uses (this app always feeds mm,
// declared via $MEASUREMENT and $INSUNITS in the header).
//
// The output deliberately mirrors a DXF known to import correctly into
// Silhouette Studio: no $ACADVER, one heavy POLYLINE per closed shape (curves
// pre-flattened into vertices), CRLF line endings and space-padded group codes.

export type DxfPoint = { x: number; y: number };

export type DxfPolylineEntity = {
  type: "POLYLINE";
  vertices: DxfPoint[];
  closed: boolean;
};

export type DxfEntity = DxfPolylineEntity;

const DEFAULT_LAYER = "0";

/** $MEASUREMENT code for metric */
const MEASUREMENT_METRIC = 1;
/** $INSUNITS code for millimeters */
const INSUNITS_MILLIMETERS = 4;

type GroupPair = [code: number, value: string];

function formatNum(n: number): string {
  // Round to avoid floating point noise while keeping mm-scale precision.
  return (Math.round(n * 1e6) / 1e6).toString();
}

function serializeEntity(entity: DxfEntity): GroupPair[] {
  return [
    [0, "POLYLINE"],
    [8, DEFAULT_LAYER],
    // Vertices-follow flag: required for R12 heavy polylines.
    [66, "1"],
    [70, entity.closed ? "1" : "0"],
    ...entity.vertices.flatMap((v): GroupPair[] => [
      [0, "VERTEX"],
      [8, DEFAULT_LAYER],
      [10, formatNum(v.x)],
      [20, formatNum(v.y)],
    ]),
    [0, "SEQEND"],
  ];
}

export function buildDxfDocument(entities: DxfEntity[]): string {
  const pairs: GroupPair[] = [
    [0, "SECTION"],
    [2, "HEADER"],
    [9, "$MEASUREMENT"],
    [70, MEASUREMENT_METRIC.toString()],
    [9, "$INSUNITS"],
    [70, INSUNITS_MILLIMETERS.toString()],
    [0, "ENDSEC"],
    [0, "SECTION"],
    [2, "ENTITIES"],
    ...entities.flatMap(serializeEntity),
    [0, "ENDSEC"],
    [0, "EOF"],
  ];

  return pairs.flatMap(([code, value]) => [`  ${code}`, value]).join("\r\n");
}
