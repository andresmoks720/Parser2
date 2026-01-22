# SURGICAL PARSING NUANCES

This document captures the hyper-specific parsing details discovered during the surgical audit of `main.js`. These are the "hidden" logic branches that handle data normalization and schema drift.

---

## 1. Telemetry Vector & Client-Side Bearing
- **The Telemetry Vector**: `e[5]` is not a scalar speed value; it is a displacement object `{latitude, longitude}` (m/s) used for client-side bearing calculation.
- **Client-Side Bearing**: The application uses `turf.bearing` between the current coordinate and a virtual target shifted by the velocity vector to determines icon rotation.
- **The Telemetry Jump**: Confirmed that the live site does NOT interpolate drone positions. They "jump" to their new position every frame if data is available.
- **The Animation Frame Throttle**: All telemetry map updates are batched via `requestAnimationFrame` (the `yt` function).
- **Staleness Purge**: Telemetry data is purged from local state exactly 60 seconds after its `createdAt` timestamp.

## 2. The UUID Time Traveler & Session ID
- **UUID v1**: The application uses a manual XOR/Shift/Mask implementation of UUID v1 with a Gregorian offset (`122192928e5`) for session tracking.
- **Session Header**: The `x-id` header is constructed as `Date.now() + "." + F()` (where `F` is the UUID v1).

## 3. Temporal Precision Hack
The backend is sensitive to millisecond precision in ISO strings. The frontend forcefully removes `.000` from timestamps.
- **Logic**: `date.toISOString().replace(".000", "")`
- **Result**: `2023-10-27T10:00:00.000Z` → `2023-10-27T10:00:00Z`

## 4. OPv3 Schema Drift
The application dynamically changes its payload structure based on the `OPv3` environment flag.

| Field | Legacy (v2) | OPv3 (v3) |
| :--- | :--- | :--- |
| **Aircraft Info** | `uasRegistrations` (Array) | `aircraftInfos` (Array) |
| **Contact Phone** | `phone` (String) | `phones` (Array of Strings) |
| **Operator ID** | `user.email` | `company.registrationNumber` (if available) |

## 5. Altitude Snapping & Units
The system uses a two-way conversion and a nearest-neighbor snapping algorithm.

### Snapping Algorithm
To snap an arbitrary height `h` to the set `S = [10, 30, 50, 80, 100]`:
1. Calculate absolute differences: `diffs = S.map(v => Math.abs(v - h))`
2. Find index of minimum difference.
3. Return `S[index]`.

### Unit Conversions
- **Internal Storage**: Meters (strictly).
- **Display (US/Imperial)**: `meters * 3.28084` (Feet).
- **Input (Legacy/Mixed)**: If input is marked as `FT`, it is converted via `feet * 0.3048`.

## 6. String Sanitization Regexes
- **Pilot Name**: `lastName.split("(")[0].trim()` (Strips metadata in parentheses).
- **Phone Validation**: `/^\+?[\d\s]+$/` (Optional plus, only digits and spaces).
- **Cookie Cleaning**: `/%(2[346B]|5E|60|7C)/g` used for character encoding.

## 7. Map Fit Precision
The "Zoom to Feature" logic uses different padding based on the feature type:
- **Default**: `32px` padding.
- **Reservations**: `16px` padding (tighter zoom).

## 8. Icon Mapping Hierarchy
Icons are assigned via a priority match:
1. `plane-emergency` (if emergency flag set)
2. `uas-emergency` (if emergency flag set)
3. `plane` (if type is manned)
4. `uas` (default)
## 9. Double Modulo Fail-Safe
Coordinates and cyclic values use `((x % limit) + limit) % limit` (implemented as `normalizeCyclic`) to ensure positive results even for negative inputs across the dateline or color cycles.
