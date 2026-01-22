# MICRO-LOGIC & UI INTERACTION DETAILS

This document captures the most minute, "invisible" details of the utm.eans.ee interface and its underlying logic.

---

## 1. Dynamic Cursor States

The application manages the map's cursor style dynamically based on the current mode and what the user is hovering over.

| Cursor Style | Trigger Condition |
| :--- | :--- |
| `crosshair` | Active when in `drawPlan` mode (drawing points or polygons). |
| `move` | Hovering over existing route points (`route-point-symbols`) or midpoint handles (`route-midpoint-symbols`). |
| `pointer` | Hovering over interactive features like UAS zones or other operation plans. |
| `grab` | Default panning state on the map. |
| `grabbing` | Active during map panning (panning drag). |

---

## 2. Selection & Highlight Layer

Specifically for selected or hovered features, a dedicated source and layer exist to provide immediate visual feedback.

*   **Source Name**: `highlight`
*   **Layer Name**: `highlight-line`
*   **Specifications**:
    *   **Color**: `#000000` (Black)
    *   **Opacity**: `0.8`
    *   **Width**: `3px`
    *   **Logic**: This layer is updated instantly when a feature is clicked or hovered, ensuring the highlight appears on top of all other UAS zones.

---

## 3. Midpoint & Interaction Logic

The "midpoint handle" allows users to add points to a line or polygon by dragging the center of a segment.

*   **Calculation**: Midpoints are generated for every pair of consecutive coordinates using `turf.midpoint`.
*   **The `mousedown` Transition**: 
    1.  User clicks a midpoint handle (`route-midpoint-symbols`).
    2.  The `mousedown` handler identifies the `pointIndex` (the index of the segment it belongs to).
    3.  A new coordinate is `spliced` into the `currentDrawing` array at that index.
    4.  The midpoint is instantly converted into a permanent route point, and a new set of midpoints is calculated for the two resulting segments.

---

## 4. Self-Intersection Prevention (The `turf.kinks` Check)

To ensure valid flight geometries, the system prevents polygons from intersecting themselves.

*   **Logic**: 
    1.  Triggered on `mousemove` (drag) for polygon vertices.
    2.  The system runs `turf.kinks(currentPolygon)`.
    3.  If `kinks.features.length > 0`:
        *   The drag is disallowed or the point is reverted to its previous valid position (`t.lng = a.lng; t.lat = a.lat`).
        *   An internal alert `draw.error.intersectingPolygon` is triggered to block submission.

---

## 5. UI Elements & State Constraints

### Altitude Snapping
The altitude slider in the UI doesn't just scroll; it snaps to a hardened set of values to ensure compliance with common regulatory thresholds.
*   **Values**: `[10, 30, 50, 80, 100]` meters.
*   **Selection Logic**: The `oninput` handler performs a "closest match" search:
    ```javascript
    const closest = thresholds.reduce((prev, curr) => 
      Math.abs(curr - rawValue) < Math.abs(prev - rawValue) ? curr : prev
    );
    ```

### Button Auto-States
*   **The 'Activate' Button**: 
    *   **Visibility**: Hidden if the current time is not within the `MAX_ACTIVATION_LEAD_TIME` window (default: 60 minutes before start).
    *   **Locking**: On click, the button is blocked by adding a `.loading` class, disabling interaction.
    *   **Icon Transition**: The label is replaced with the `loader-2` spinning SVG icon from the Tabler library.

---

## 6. Telemetry & Real-Time Performance

*   **Rotation Logic**: To prevent "jumping" aircraft icons, the bearing is calculated on every telemetry update using `turf.bearing(p1, p2)`.
*   **Frame Batching**: Updates to the `telemetry` source are batched with `requestAnimationFrame` to maintain 60fps, even if multiple telemetry pulses arrive simultaneously from different aircraft.

---

## 7. Color & Theme Logic

The application uses an internal function `rt(colorCode)` for cross-scheme transformations.
*   **The Inversion Trick**: For the dark mode theme, lightness (L in HSL) is often inverted using `h = 1 - h`. This ensures that restrictive zone colors (like RED) remain recognizable but fit the dark aesthetic.
*   **String Trimming**: The HSL/RGB parser proactively runs `.replace(/ /g, "")` to handle CSS whitespace inconsistencies.

---

## 8. Persistence & Storage

The application preserves state using the Capacitor Preferences API.

| Key | Description |
| :--- | :--- |
| `id` | Session identifier formatted as `Date.now() + "." + UUIDv4`. |
| `lang` | Last selected language (`eng`, `est`, etc.). |
| `basemap` | The map style URL to use on next load. |

---

## 9. Third-Party Data Integrations

*   **Wind Grid Querying**: The bbox-based wind query uses specific zoom-dependent padding to ensure edge wind data is available for panning.
*   **Aviation Alerts**: Weather warnings are fetched from `/weather/ee/warnings.json`, distinct from the general forecast.
*   **Terrain multiplier**: The 3D terrain uses a height multiplier that increases as the user zooms in, providing sharper relief at lower altitudes.
