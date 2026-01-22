# Best practices for a restricted-areas-only map (NOTAM + AIP)

## Scope and intent

This document captures **deeper, actionable guidance** distilled from the EANS and drooniradar implementations for a **minimal product** that only renders restricted areas on a map. The focus is a lean pipeline: **ingest → normalize → transform → render**, with no route planning, telemetry, or violation detection.

## Best practices to adopt (required for the minimal overlay)

### 1) Use the shared GeoJSON + restriction-centered model

Both EANS and drooniradar assume restricted areas arrive as GeoJSON `Feature` polygons (or multipolygons) with `[lng, lat]` coordinate order, and they both treat a `restriction` field as the canonical input for styling. This is the common foundation you should keep for a simple “show restricted areas” implementation: ingest authoritative GeoJSON and drive map styling from a normalized restriction field.

**Why this matters for you**
- It keeps the map pipeline simple—just standard polygons + restriction metadata.
- It avoids custom coordinate transforms or ambiguous styling rules.

**Evidence**
- Shared polygon assumptions and `[lng, lat]` ordering.【F:analysis/eans_vs_drooniradar_spec_analysis.md†L12-L15】
- NOTAM transformation yields map-ready polygons.【F:parser_proto/drooniradar/notams.md†L560-L598】

---

### 2) Normalize NOTAM/AIP feeds into a single restriction schema

EANS expects restriction values like `NO_RESTRICTION`, `CONDITIONAL`, `REQ_AUTHORISATION`, `PROHIBITED`, while drooniradar derives restriction from `reason` and keeps a smaller set. For your implementation, pick a canonical restriction enum (likely the EANS four-level model) and map NOTAM + AIP inputs into it so all zones can render consistently.

**Practical takeaway**
- A normalization step keeps your renderer simple and avoids “special case” styling per data source.

**Evidence**
- Differences in restriction classification between EANS and drooniradar are documented in the spec analysis.【F:analysis/eans_vs_drooniradar_spec_analysis.md†L45-L47】

---

### 3) Adopt EANS-style rendering discipline (layering + stable ordering)

EANS enforces a strict rendering order and programmatic sorting before data hits the map—features are ordered so higher-priority items draw last (on top). This pattern is perfect for restricted-area overlays to avoid visual randomness when polygons overlap.

**Practical takeaway**
- Even with a minimal map, keep deterministic ordering (stable sort before `setData`) to ensure priority zones render on top and aren’t hidden by less important zones.

**Evidence**
- EANS rendering stack and data-order sorting behavior.【F:parser_proto/EANS/RENDERING_STACK.md†L5-L25】

---

### 4) Use a consistent restriction color system with hidden-feature support

EANS provides an explicit restriction-to-color mapping plus opacity expressions (including a `hidden` flag that can suppress fills/lines). These are directly applicable for a restricted-area-only overlay and give a stable, predictable visual language across sources.

**Practical takeaway**
- Lift the restriction color mapping and opacity expressions directly—this is a ready-made, consistent style guide.

**Evidence**
- EANS restriction palette and opacity expressions.【F:parser_proto/EANS/colors.ts†L43-L121】

---

### 5) Borrow drooniradar’s acquisition + parsing pipeline mindset for NOTAMs

Drooniradar emphasizes a multi-stage pipeline: acquisition, parsing/normalization, validation, and transformation into map-ready features. This is particularly relevant for NOTAM ingestion, where formats vary and the parser must extract coordinates, time windows, altitude limits, and convert them into map overlays.

**Practical takeaway**
- Keep the ingestion pipeline strict (parse → validate → transform), so the renderer only sees clean, already-normalized GeoJSON.

**Evidence**
- Drooniradar acquisition, parsing, and validation stages documented in the NOTAM workflow.【F:parser_proto/drooniradar/notams.md†L101-L134】【F:parser_proto/drooniradar/notams.md†L291-L345】

---

### 6) Transform NOTAM geometry into map-ready polygons consistently

Drooniradar’s transformation stage explicitly converts parsed NOTAMs into geographic shapes and styled features (e.g., buffers around points, polygon construction, CRS validation). This is useful for NOTAMs that are not already polygonal but need to render as restricted areas on the map.

**Practical takeaway**
- If a NOTAM is point- or arc-based, build standardized polygons (buffer/sector/convex hull) so the map always consumes the same geometry type.

**Evidence**
- The NOTAM transformation pipeline includes buffer generation, sector calculation, and polygon construction strategies.【F:parser_proto/drooniradar/notams.md†L560-L598】

---

### 7) Trim non-essential features for your scope

Both systems do much more than rendering: EANS includes route planning and operation-plan UX logic, while drooniradar includes violation checks and real-time monitoring. For a “restricted-area-only” goal, deliberately omit those extras and keep only the shared polygon + restriction visualization pipeline.

**Practical takeaway**
- Keep the implementation lean: ingestion + normalization + rendering.

**Evidence**
- Shared pipeline vs. divergent responsibilities beyond visualization.【F:analysis/eans_vs_drooniradar_spec_analysis.md†L30-L34】【F:analysis/eans_vs_drooniradar_spec_analysis.md†L90-L93】

---

## Recommended minimal architecture (restricted areas only)

### Ingestion
- Fetch AIP zones + NOTAMs.
- Parse NOTAM text into structured fields (coords, time window, altitude, authority).

### Normalization
- Normalize all zones into a single GeoJSON `FeatureCollection`.
- Map restriction data into a consistent enum (prefer EANS’s 4-level restriction model).

### Geometry transformation
- Convert non-polygon NOTAMs into polygonal features (buffers/sectors/convex hulls).
- Ensure all output coordinates remain `[lng, lat]` in WGS84.

### Rendering
- Apply consistent restriction-based styling (EANS color mapping + opacity).
- Sort features before rendering to preserve priority ordering.

---

## Deeper analysis and implementation implications

### A) Data quality gating is critical for NOTAMs

NOTAMs are free-text and often inconsistent across authorities. Drooniradar’s pipeline makes validation a first-class phase and highlights the need to filter malformed or incomplete data before map rendering. For a restricted-area-only map, the **risk is rendering invalid geometry or misleading restriction labels**.

**Actionable guidance**
- Reject or quarantine NOTAMs missing essential fields (coordinates, time window, altitude range).
- Enforce geometry validity checks before rendering (closed polygons, minimum vertex count).
- Log rejected NOTAMs with a reason for later review.

**Evidence**
- Drooniradar’s emphasis on validation stages in the NOTAM workflow.【F:parser_proto/drooniradar/notams.md†L291-L345】

---

### B) Rendering order should reflect operational severity

EANS relies on sorting features before render to enforce visibility. For a minimal map, define a **restriction severity order** and sort accordingly. This prevents low-impact zones from obscuring prohibited zones.

**Actionable guidance**
- Define and document a single severity ranking (e.g., `PROHIBITED > REQ_AUTHORISATION > CONDITIONAL > NO_RESTRICTION`).
- Perform a stable sort so original order is preserved for ties.
- Keep the sorting logic centralized so every map update uses the same policy.

**Evidence**
- EANS’s rendering stack and “sort-by-data” principle.【F:parser_proto/EANS/RENDERING_STACK.md†L18-L25】

---

### C) Styling should be restriction-driven, not source-driven

Both systems use restriction as the canonical styling input. This prevents visual drift when data comes from multiple sources (AIP vs NOTAM) and avoids the UX burden of multiple legends.

**Actionable guidance**
- Drive all fill/line colors from `restriction` only, not from source or authority.
- Reserve source-specific coloring for optional debug layers if needed.

**Evidence**
- EANS restriction palette and opacity definitions.【F:parser_proto/EANS/colors.ts†L43-L121】

---

### D) Geometry transformation should be deterministic and explainable

NOTAMs with point/arc definitions require geometric construction. Drooniradar’s pipeline calls out buffer and sector generation methods. In a production map, it is important that these constructions are **deterministic** so the same NOTAM always yields the same polygon.

**Actionable guidance**
- Use fixed defaults (e.g., 1NM radius for point-based NOTAMs) unless the NOTAM explicitly states otherwise.
- Avoid heuristics that vary by authority unless documented in a mapping table.
- Persist derived geometry metadata (e.g., radius used, method used) for debugging.

**Evidence**
- Drooniradar transformation guidance on buffer/sector/polygon creation.【F:parser_proto/drooniradar/notams.md†L560-L598】

---

## Open questions to resolve before implementation

1. **Restriction mapping policy**: Which source fields should map to `CONDITIONAL` vs `REQ_AUTHORISATION`?
2. **Polygon generation defaults**: What radius/segment defaults should be used for point-based NOTAMs?
3. **Time window usage**: Will the UI hide inactive NOTAMs by time, or always show them?
4. **Authority priority**: If AIP and NOTAM overlap, which should take precedence in sort order?

These can be settled without changing the core pipeline above.
