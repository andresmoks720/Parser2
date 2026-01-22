# UTM EANS Enums & Constants Reference

This document provides a complete registry of all enums, constants, lookup tables, and environment flags discovered during the exhaustive audit of the UTM EANS production system.

---

## 1. Operation Plan States
Found in the state machine logic of `main.js`.

| State | Description |
| :--- | :--- |
| `PROPOSED` | Initial submission state. |
| `APPROVED` | Accepted by the system or authority. |
| `AUTHORIZED` | ⭐ NEW: Formal authorization granted (often for restricted zones). |
| `TAKEOFFREQUESTED` | Pilot has requested immediate takeoff. |
| `TAKEOFFGRANTED` | ⭐ NEW: Takeoff permission received. |
| `ACTIVATED` | Mission is currently live. |
| `CLOSED` | Mission has ended (ended normally or terminated). |
| `DENIED` | Mission was rejected. |
| `TIMEOUT` | System timeout during processing. |
| `ERROR` | Internal processing error. |

---

## 2. Closure Reasons
Determines why an operation plan moved to the `CLOSED` state.

| Reason | Description |
| :--- | :--- |
| `NOMINAL` | Completed normally as scheduled. |
| `CANCELED` | User cancelled before activation. |
| `WITHDRAWN` | User withdrew during activation. |
| `REJECTED` | Automatically or manually rejected. |
| `REVOKED` | ⭐ NEW: Authorization was revoked during the mission. |
| `TIMEOUT` | Mission timed out (e.g., never activated). |

---

## 3. Conflict Types & Contexts
Used in the spatial analysis reports.

*   **Types**: `UAS_ZONE`, `OPERATION_PLAN`.
*   **Contexts**: 
    *   `TEXTUAL_RESTRICTION`: Conflict based on written rules.
    *   `AUTHORITY_REQUIREMENTS`: Conflict based on mandated approvals.

---

## 4. Restriction Categories
Exact severity ranking used for sorting logic.

| Category | Priority |
| :--- | :--- |
| `NO_RESTRICTION` | 0 |
| `CONDITIONAL` | 1 |
| `REQ_AUTHORISATION` | 2 |
| `PROHIBITED` | 3 |

---

## 5. Hidden Translation Keys
These keys are used to map internal error codes to user-facing strings.

| Key | Scenario |
| :--- | :--- |
| `draw.error.intersectingPolygon` | Polygon crosses itself. |
| `draw.error.areaIncomplete` | Drawing ended too early. |
| `draw.error.emptyPath` | No points drawn. |
| `draw.error.areaTooSmall` | Buffered area is below minimum threshold. |
| `operationplan.error.flightPlanTooFarAhead` | Start date exceeds system look-ahead. |
| `operationplan.error.authorizationNeededStartTimeTooSoon` | Not enough lead time for approval. |
| `operationplan.error.startBeforeNow` | Mission start is in the past. |
| `operationplan.error.durationTooLong` | Exceeds max allowed flight time. |

---

## 6. Environment Flags (`window.ENV`)
Flags retrieved from `/avm/env` that toggle core features.

*   **OPv3**: `true` (Enables the new Operation Plan v3 schema).
*   **CONVERT_TO_LOCAL_TIMES**: `true` (Determines if timestamps are localized on the client).
*   **WIND_GRID_ENABLED**: `true` (Enables the dynamic wind-grid vector layer).
*   **MOBILE**: `true` (Toggles Capacitor/Mobile specific UI logic).
*   `METARS` | Toggles the weather observation station layer.
*   `PAYMENT_DEMO` | Shows a mock payment flow for authorized plans.
*   `HIDE_REASON` | Hides the closure reason from the user UI.
*   `DISABLE_GLOBE_PROJECTION` | Forces 2D Mercator view.
*   `BVLOS_MAX_FLIGHT_DURATION` | `240` | Max duration for BVLOS (minutes).
*   `VLOS_MAX_LEAD_TIME` | `10080` | Max lead time for VLOS (minutes).
*   `TS` | Cache-busting timestamp for tiles.

---

## 7. Math & Precision Constants

*   **Meters to Feet**: `3.28084`
*   **Feet to Meters**: `0.3048`
*   **Speed Multiplier**: `3.6` (m/s to km/h)
*   **EPSG:4326** (WGS84 2D for GeoJSON)
*   **EPSG:3857** (Web Mercator for Map Rendering)
*   **EPSG:4979** (WGS84 3D for Altitude-aware positions)

### Numerical Forecasting & Timing Sets
*   **Intervals**: `[15, 30, 45, 60, 90, 120, 180, 240, 300, 360]` (Minutes for weather/bearing/forecasting buffers)
*   **High Altitude Break**: `120` meters.
*   **Coordinate Wrapping**: `((lng + 180) % 360 + 360) % 360 - 180`.
*   **Flyk-ID Prefix**: `flyk-` (used for internal UUID generation).

---

## 8. Theme Color Values (HSL)

### Austrocontrol Theme
*   `NO_RESTRICTION`: `hsl(196, 48%, 49%)`
*   `CONDITIONAL`: `hsl(209, 100%, 20%)`
*   `PROHIBITED`: `hsl(1, 98%, 55%)`

### EANS Theme (Default)
*   `NO_RESTRICTION`: `hsl(120, 50%, 40%)`
*   `CONDITIONAL`: `hsl(90, 65%, 40%)`
*   `REQ_AUTHORISATION`: `hsl(60, 65%, 40%)`
*   `PROHIBITED`: `hsl(0, 100%, 52.5%)`
