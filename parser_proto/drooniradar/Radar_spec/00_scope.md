# Scope

## Purpose
Define the implementable logic specification (“logic IR”) for parsing, normalizing, and styling UAS GeoJSON air zone data and evaluating position violations. This spec is derived solely from Phase 1 artifacts in `parser/uasParser.js` and `parser/logic.md` and should be treated as the authoritative behavior baseline for a clean implementation.

## In Scope
- Multi-source NOTAM acquisition workflow and scheduling rules (from source discovery through QA and retry behavior).
- NOTAM parsing and validation pipeline stages as documented in Phase 1 artifacts.
- Transformation and enrichment steps required to prepare airspace data for mapping.
- Parsing and normalization of GeoJSON Feature properties into an AirZone abstraction.
- Restriction derivation and restriction level mapping.
- Localized message selection.
- Point-in-geometry checks for Polygon and MultiPolygon GeoJSON features.
- Violation detection for a position (lat/lng/alt) against a zone.
- Feature filtering and styling rules.
- Transforming raw GeoJSON features into the Unified Airspace Schema shape.

## Out of Scope
- Runtime UI implementation details beyond the documented styling and map-layer integration behaviors.
- Ground elevation/terrain lookup and true AGL/AMSL conversion.
- Any behavior not evidenced in the Phase 1 artifacts.

## Assumptions (Explicit)
- If a lower limit is expressed as `AGL`, it is treated as `0` during violation checks because terrain elevation is not available. (Observed comment in code, not an invented requirement.)
- Altitude parsing for transformation defaults to feet and AMSL/SFC references when explicit units are not provided; non-numeric strings fall back to `0` with a supplied default reference datum.

## Terminology (Glossary)
- **Air Zone**: A GeoJSON Feature representing a zone with airspace restrictions.
- **Restriction**: A normalized classification of access (`NO_RESTRICTION`, `REQ_AUTHORISATION`, `PROHIBITED`).
- **Restriction Level**: Numeric severity mapping for a restriction (`0`, `1`, `2`).
- **Localized Message**: A message chosen from `extendedProperties.localizedMessages` based on language prefix.
- **Violation**: A position that is inside a zone’s geometry and within the altitude range.
- **Feature**: A GeoJSON Feature with `geometry` and `properties`.

## Vocabulary Normalization
The following terms are canonical and must be used consistently:
- “restriction” (not “access level” or “classification”).
- “Air Zone” (not “airspace region”).
- “lowerLimit” / “upperLimit” (not “minAltitude” / “maxAltitude”).
- “localized message” (not “translated message”).

## Phase 2 Codex Prompt Pattern (Process Guidance)
Use the following prompt template when asking Codex to tighten specs based on Phase 1 artifacts:

> “Given these Phase 1 decision tables + examples, produce a canonical spec section that is unambiguous: list conditions, precedence, outputs, and link each rule to at least one example ID. Flag any uncovered branches.”
