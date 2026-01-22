# HIDDEN DETAILS & OBJECTIONABLE ARCANA

This document catalogs the "invisible" technical details discovered during the "Different Angle" audit of the UTM EANS environment. These details are critical for perfect replication of the system's behavior.

---

## 1. Telemetry Positional Array (The "Secret" Schema)

Surprisingly, live aircraft telemetry is **not** sent as a keyed JSON object. To save bytes, it uses a fixed-length positional array.

| Index | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| **0** | `id` | String | Unique hex or platform ID. |
| **1** | `name` | String | Callsign, Pilot Name, or Drone ID. |
| **2** | `timestamp` | Number | Creation time (Unix ms). |
| **3** | `lat` | Number | WGS-84 Latitude. |
| **4** | `lng` | Number | WGS-84 Longitude. |
| **5** | `speed` | Number | Velocity in m/s (displayed as km/h). |
| **6** | `alt` | Number | Altitude in Meters (AGL). |
| **7** | `type` | String | Aircraft category. |
| **8** | `icon` | String | Symbol ID (e.g., `plane`, `uas`). |
| **9** | `opacity` | Number | 0 to 1 float for visual state. |

---

## 2. Event Bus Registry (Internal Communication)

The application uses a central event emitter for inter-component communication.

### App Level (`app:`)
- `app:ready`: Initial loading complete.
- `app:visibilitychange`: Triggered via `document.hidden`.
- `app:error`: Global error notification.

### Map Level (`map:`)
- `map:reset`: Clears all overlays.
- `map:zoomed`: Triggered on viewport shift.
- `map:loaded`: Source/Layer injection complete.

### Drawing Level (`draw:`)
- `draw:start`: Drawing mode activated.
- `draw:stop`: Drawing mode deactivated.
- `draw:update`: Internal state changed during dragging.

---

## 3. Storage Layer Forensics

The system uses **Capacitor Storage** wrapping for cross-platform persistence.

| Key | Purpose |
| :--- | :--- |
| `_capuid` | Permanent device UID used for `x-id` headers. |
| `CapacitorStorage.lang` | User i18n preference. |
| `CapacitorStorage.termsRead` | Checksum of the last read terms of service. |
| `flyk-last-pos` | Last known map center [lng, lat, zoom]. |

---

## 4. Browser & Platform Hacks

The system contains explicit branches for browser quirks:

*   **Firefox Hack**: A `firefox: true` property is passed to the telemetry interpolation engine. This forces a lower precision for CSS `transform` values to prevent "shaky" movement in Gecko-based browsers.
*   **Mobile UI Toggle**: The `MOBILE` environment flag hides the "Clock" and "Nonrejective Conflicts" to maximize screen real estate for drawing.

---

## 5. Network Protocol Details

*   **Custom Headers**: 
    *   `orgId`: Sent with all flight plan requests.
    *   `x-table`: Used for grid-based tile lookups.
*   **Enforced Accept**: All `utm/` endpoints explicitly require `Accept: application/json` or the server returns 406.
