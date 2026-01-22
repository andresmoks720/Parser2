# Edge Case Math & Bitwise Logic

This document catalogs the low-level "chaotic" logic used by UTM EANS to handle extreme edge cases and time-based identifiers.

## 1. The UUID Time Traveler
The application uses a manual XOR/Shift/Mask implementation of **UUID v1** (time-based) for session and event tracking.

### Gregorian Offset
- **Constant**: `122192928e5`
- **Definition**: The number of 100-nanosecond intervals between the Gregorian calendar (Oct 15, 1582) and the Unix Epoch. This follows RFC 4122.

### Bitwise Packing
The UUID is packed using bitwise shifts to slice 64-bit timestamps into a `Uint8Array(16)`.
- `time_low`: `low >>> 24 & 255`, etc.
- `clock_seq`: `16383 & (n[8] << 8 | n[9])` (14-bit sequence).

## 2. The Double Modulo Fail-Safe
To prevent bugs related to negative results of the `%` operator in JavaScript, the application uses a "double modulo" pattern for cyclic values.

### Longitude Normalization
- **Logic**: `((lng + 180) % 360 + 360) % 360 - 180`
- **Purpose**: Ensures that even if `lng + 180` is negative (e.g., `-750`), the result always wraps correctly into the `[0, 360)` range before being shifted back to `[-180, 180]`.

## 3. Bilinear Lightness Interpolation
The HSL-to-RGB conversion logic includes a conditional bilinear interpolation to manage saturation scaling.

- **Formula**: `u <= 0.5 ? u * (l + 1) : u + l - u * l`
- **Context**: Used during theme transformation (light/dark mode) to ensure colors remain harmonious as lightness shifts toward the axes.

## 4. Ghost Layout Constants
Certain layout constants are defined in `rem` units with extreme values to force-override container behaviors.
- **Max Layout**: `375rem` (approx. 6000px) is used in specific overlay transformations to ensure geometric overflow doesn't trigger clipping.
