# UNDER-THE-HOOD: INFRASTRUCTURE & FRAMEWORK DETAILS

This document captures the structural and infrastructural details of the utm.eans.ee application discovered during the final diagnostic phase.

---

## 1. UI Framework: RE:DOM

The application does **not** use a mainstream framework like React, Vue, or Angular. Instead, it uses **RE:DOM** (`redom.js`).

*   **Architecture**: Uses a "mount/unmount" pattern with efficient DOM diffing.
*   **Map Integration**: The MapLibre instance is wrapped in a RE:DOM component, allowing for clean lifecycle management (`onmount`, `onunmount`).
*   **Performance**: RE:DOM is extremely lightweight (~2KB), contributing to the site's rapid load times.

---

## 2. Infrastructure: White-Labeled Flyk

The site is a customized, white-labeled instance of the **Flyk** UTM platform.

*   **Asset Hosting**: Sprites, glyphs, and style JSON files are hosted at `flyk.com`.
*   **Platform Version**: Currently running version `1.57.8`.
*   **Capacitor Wrapper**: The application is built to run both as a web app and as a native mobile app via **Capacitor**.

---

## 3. Security & Authentication

*   **Auth Provider**: Integrated with **Keycloak** (SKYZR_KEYCLOAK) for Single Sign-On.
*   **Token Management**: Uses standard OAuth/OIDC flows, with tokens often passed to the Socket.IO `auth` handshake.

---

## 4. Advanced Regulatory Constants

Specific business logic constants found in the `window.ENV` config:

| Constant | Value | Description |
| :--- | :--- | :--- |
| `BVLOS_MAX_FLIGHT_DURATION` | `240` | Max duration for Beyond Visual Line of Sight missions (minutes). |
| `VLOS_MAX_LEAD_TIME` | `10080` | Max lead time for VLOS missions (7 days in minutes). |
| `ALTITUDE_REFERENCE` | `ABOVE_GND` | Default height reference for all UAS operations. |
| `MAX_ACTIVATION_LEAD_TIME` | `60` | Minutes before start when the 'Activate' button appears. |

---

## 5. File Processing & External Libs

*   **`toGeoJSON`**: Used internally to convert uploaded **KML** and **GPX** files into the system's native GeoJSON format.
*   **`turf.js`**: Reconfirmed as the primary engine for all spatial analysis, localized under the internal `ft` namespace in the bundle.

---

## 6. GPU & Map Optimizations

*   **High-Altitude Bifurcation**: At `120m` (AGL), the system switches between `uas` and `uas-high` layers to optimize rendering performance.
*   **GPU Transparency**: Layer visibility is toggled on the GPU using MapLibre expressions: `["case", ["==", ["get", "hidden"], true], 0, 1]`, rather than removing/adding layers from the CPU.

---

## 7. Session & Lifecycle Details

*   **Visibility Monitoring**: The app listens for `visibilitychange`. When the tab is hidden, it throttles non-essential Socket.IO updates and pauses the `sendStats` pulse.
*   **Cache Busting**: Style URLs and tile requests are appended with a `?ts=` timestamp derived from the current version deployment time.
