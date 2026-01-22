# Map Rendering Stack & Sorting Principles

This document explains how UTM EANS manages the visual priority of map elements.

## The Rendering Stack (Bottom-to-Top)

Layers are added to the MapLibre instance in a strict sequence. Higher items in this list visually overlap items below them.

1.  **Basemap Overlay**: `basemap`, `clouds`
2.  **Reservations**: `reservations-fills`, `reservations-lines`
3.  **Operation Plans**: `operationplans-fills`, `operationplans-lines`, `operationplans-symbols`
4.  **Weather Context**: `weather-fills`, `weather-observations`, `metars`, `wind-grid`
5.  **UAS Zones (Low/High)**: `uas-fills`, `uas-high-fills`, `uas-lines`, `uas-symbols`
6.  **Real-time Traffic**: `telemetry-symbols`
7.  **Active Route**: `route-area`, `route-line`, `route-point-symbols`
8.  **Interaction**: `highlight-line`

## The "Sort-by-Data" Principle

UTM EANS does **not** use the `symbol-sort-key` property in MapLibre. Instead, it relies on programmatic sorting of the GeoJSON data array before `setData` is called.

### How it works:
1.  **Sorting**: The `sortFeatures` function (documented in `sorting.ts`) runs its 4-pass hierarchy on the feature array.
2.  **Stability**: The sort is stable, ensuring original order is preserved for ties.
3.  **Drawing Order**: Symbols at the **end of the array** are drawn last, placing them on top of symbols appearing earlier in the array.

## Collision & Visibility Rules

| Layer | `icon-allow-overlap` | `symbol-placement` | Goal |
| :--- | :--- | :--- | :--- |
| `telemetry-symbols` | `true` | `point` | Ensure real-time traffic is never hidden by collisions. |
| `uas-symbols` | `false` | `line` | Labels anchor to the polyline; collisions prevent label overlap. |
| `route-points` | `true` | `point` | Drawing handles must always be visible for editing. |
| `operationplans-symbols` | `false` | `line` | Labels follow the proposed flight path. |

## Hidden "Before ID" Insertions

The system uses `beforeId` to maintain specific relationships without re-adding layers:
- **Hillshades**: Inserted before `waterway-tunnel` to sit under the label stack.
- **Wind Grid**: Inserted before `telemetry-symbols` to ensure aircraft appear over the grid.
