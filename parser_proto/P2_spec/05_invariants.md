# Invariants

## Geometry & Coordinates
- Coordinates are always treated as `[lng, lat]` (WGS84). No coordinate transformation is performed.
- Buffer distances are interpreted in **meters** and converted to kilometers for Turf buffering (`bufferMeters / 1000`).

## Intersection & Filtering
- Hidden features (`properties.hidden === true`) are never returned from point hit-testing.
- Intersection checks are best-effort: individual failures do not abort the full filter.

## Sorting
- Sorting is stable across **four passes**; later passes take precedence over earlier passes.
- `_rejecting === true` elevates restriction priority to the highest severity.

## Validation
- Phone validation allows a leading `+` followed by digits/spaces only.
- Negative `mtom` or `maxAltitude` always yield validation errors.
- `startDatetime` must be after now; `endDatetime` must be after both now and `startDatetime`.

## Cleanup
- Alerts older than 1 hour and telemetry older than 1 minute are removed.

## Performance (Observable Only)
- No explicit performance constraints are defined beyond stable multi-pass sorting and best-effort intersection logic.

## Styling
- Color mappings and layer ordering use fixed constants unless a theme override is explicitly selected.
