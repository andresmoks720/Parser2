/**
 * EXACT formatting utilities from utm.eans.ee
 * 
 * This file contains all string/number formatting functions with
 * EXACT precision and logic from the original implementation.
 */

/**
 * Normalize a cyclic value to [0, limit)
 * EXACT "Double Modulo" fail-safe from main.js
 */
export function normalizeCyclic(val: number, limit: number): number {
    return ((val % limit) + limit) % limit;
}

/**
 * Normalize longitude to range [-180, 180]
 * EXACT math from function xt(e) in main.js
 * 
 * @param lng - Raw longitude
 * @returns Wrapped longitude
 */
export function wrapLongitude(lng: number): number {
    return normalizeCyclic(lng + 180, 360) - 180;
}

/**
 * EXACT Coordinate Normalization Object Utility
 * Logic from function xt(e) in main.js
 * 
 * CRITICAL: This function modifies the longitude but intentionally 
 * IGNORES latitude clamping, allowing values > 90 to propagate.
 */
export function normalizeCoordinates(coord: { lat: number; lng: number }): { lat: number; lng: number } {
    const lng = coord.lng;
    // e.lat; // Production evaluates but does nothing
    coord.lng = ((lng + 180) % 360 + 360) % 360 - 180;
    return coord;
}

/**
 * Format coordinate to exactly 6 decimal places
 * EXACT: All coordinates in utm.eans.ee use .toFixed(6)
 * 
 * @param value - Coordinate value (latitude or longitude)
 * @returns String with exactly 6 decimal places
 */
export function formatCoordinate(value: number): string {
    return value.toFixed(6);
}

/**
 * Format Date to ISO string with the EXACT production hack
 * 
 * Production (main.js) removes the .000 millisecond part for 
 * backend compatibility.
 * 
 * @param date - Date object to format
 * @returns Sanitized ISO string
 */
export function formatISODate(date: Date): string {
    return date.toISOString().replace(".000", "");
}

/**
 * EXACT Altitude Snapping Algorithm
 * 
 * Production (main.js) snaps an arbitrary height to the nearest
 * value in a regulatory-hardened set using an absolute difference search.
 */
const ALTITUDE_SNAP_SET = [10, 30, 50, 80, 100];

export function snapToRegulatoryAltitude(h: number): number {
    return ALTITUDE_SNAP_SET.sort((a, b) => Math.abs(a - h) - Math.abs(b - h))[0];
}

/**
 * EXACT Unit Conversions
 */
export const UNIT_CONVERSION = {
    M_TO_FT: 3.28084,
    FT_TO_M: 0.3048
};

/**
 * Generate UUID v4 with flyk- prefix
 * EXACT logic: flyk- prefix used for mobile/Capacitor session IDs.
 * 
 * @returns Flyk-prefixed UUID string
 */
export function generatePlatformUUID(): string {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return `flyk-${uuid}`;
}

/**
 * Format bearing to 3-digit padded string with degree symbol
 * EXACT: Bearing is padded to 3 digits
 * 
 * @param bearing - Bearing in degrees (0-360)
 * @returns Formatted string like "045°", "180°", "005°"
 */
export function formatBearing(bearing: number): string {
    // Normalize bearing to 0-359
    const normalized = ((Math.round(bearing) % 360) + 360) % 360;

    // Pad to 3 digits
    return ("00" + normalized).slice(-3) + "°";
}

/**
 * Convert ground speed from m/s to km/h
 * EXACT: Multiply by 3.6
 * 
 * @param mps - Speed in meters per second
 * @returns Speed in kilometers per hour
 */
export function mpsToKmh(mps: number): number {
    return mps * 3.6;
}

/**
 * Format speed for display
 * 
 * @param mps - Speed in meters per second
 * @returns Formatted string like "36 km/h"
 */
export function formatSpeed(mps: number): string {
    const kmh = Math.round(mpsToKmh(mps));
    return `${kmh} km/h`;
}

/**
 * Sanitize color code by removing all spaces
 * EXACT: .replace(/ /g, "")
 * 
 * @param colorCode - Color code string (hex, rgb, hsl)
 * @returns Sanitized color code
 */
export function sanitizeColorCode(colorCode: string): string {
    return colorCode.replace(/ /g, "");
}

/**
 * Sanitize altitude string (uppercase M to lowercase m)
 * EXACT: .replace("M", "m")
 * 
 * @param altitude - Altitude string like "120M"
 * @returns Normalized string like "120m"
 */
export function sanitizeAltitudeString(altitude: string): string {
    return altitude.replace("M", "m");
}

/**
 * Normalize pilot name (remove parenthetical metadata)
 * EXACT: .split("(")[0].trim()
 * 
 * @param lastName - Last name possibly with metadata
 * @returns Clean last name
 */
export function normalizePilotName(lastName: string): string {
    return lastName.split("(")[0].trim();
}

/**
 * Format date to Estonian format
 * EXACT: Uses .padStart(2, "0") for all segments
 * 
 * @param date - Date object
 * @returns Formatted string "DD.MM.YYYY HH:mm"
 */
export function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}.${year} ${hour}:${minute}`;
}

/**
 * Format date to ISO string for API
 * 
 * @param date - Date object
 * @returns ISO 8601 string
 */
export function formatDateISO(date: Date): string {
    return date.toISOString();
}

/**
 * Generate UUID v4
 * EXACT: Standard UUID v4 with specific masks (0x3f, 0x80)
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * EXACT UUID v1 (Time-based) with Gregorian Offset
 * Logic from function F() in main.js
 */
const GREGORIAN_OFFSET = 122192928e5; // Oct 15, 1582 to Unix Epoch
let uuidState = {
    msecs: -Infinity,
    nsecs: 0,
    clockseq: (Math.random() * 0x3fff) | 0,
    node: new Uint8Array(6).map(() => (Math.random() * 256) | 0)
};
uuidState.node[0] |= 1; // Multicast bit

export function generateUUIDv1(): string {
    let now = Date.now();
    if (now === uuidState.msecs) {
        uuidState.nsecs++;
        if (uuidState.nsecs >= 10000) {
            uuidState.nsecs = 0;
            uuidState.msecs = now;
        }
    } else if (now > uuidState.msecs) {
        uuidState.nsecs = 0;
        uuidState.msecs = now;
    } else {
        // Clock regression: reseed
        uuidState.clockseq = (uuidState.clockseq + 1) & 0x3fff;
        uuidState.nsecs = 0;
        uuidState.msecs = now;
    }

    const t = now + GREGORIAN_OFFSET;
    const low = ((1e4 * (t % 4294967296)) + uuidState.nsecs) % 4294967296;
    const midHigh = (t / 4294967296 * 1e4) & 0xfffffff;

    const hex = (val: number, len: number) => val.toString(16).padStart(len, '0');

    return (
        hex(low, 8) + "-" +
        hex(midHigh & 0xffff, 4) + "-" +
        hex(((midHigh >>> 16) & 0x0fff) | 0x1000, 4) + "-" +
        hex((uuidState.clockseq & 0x3fff) | 0x8000, 4) + "-" +
        Array.from(uuidState.node).map(b => hex(b, 2)).join("")
    ).toLowerCase();
}

/**
 * EXACT Session ID construction for x-id header
 * Logic: Date.now() + "." + F()
 */
export function generateSessionID(): string {
    return Date.now() + "." + generateUUIDv1();
}

/**
 * State transition delimiter
 * EXACT: May use en-dash, not hyphen
 */
export const STATE_TRANSITION_DELIMITER = " –> ";  // en-dash

/**
 * Altitude conversion constants
 * EXACT: Both directions have dedicated constants
 */
export const ALTITUDE_CONSTANTS = {
    METERS_TO_FEET: 3.28084,
    FEET_TO_METERS: 0.3048,
} as const;

/**
 * Convert meters to feet
 * EXACT: Multiply by 3.28084
 */
export function metersToFeet(meters: number): number {
    return meters * ALTITUDE_CONSTANTS.METERS_TO_FEET;
}

/**
 * Convert feet to meters
 * EXACT: Multiply by 0.3048 (NOT divide by 3.28084)
 */
export function feetToMeters(feet: number): number {
    return Math.round(feet * ALTITUDE_CONSTANTS.FEET_TO_METERS);
}

/**
 * Buffer limits
 * EXACT: MAX is 2000, not 1000
 */
export const BUFFER_LIMITS = {
    DEFAULT: 50,
    MIN: 0,
    MAX: 2000,  // CORRECTED: Was previously thought to be 1000
} as const;

/**
 * Validate and clamp buffer value
 * 
 * @param buffer - Buffer in meters
 * @returns Clamped buffer value
 */
export function clampBuffer(buffer: number): number {
    if (buffer < BUFFER_LIMITS.MIN) return BUFFER_LIMITS.MIN;
    if (buffer > BUFFER_LIMITS.MAX) return BUFFER_LIMITS.MAX;
    return buffer;
}

/**
 * Timing constants (all in milliseconds)
 * EXACT values from utm.eans.ee
 */
export const TIMING_CONSTANTS = {
    HELLO_INIT_DELAY: 100,      // Wait before first fetchPlans
    THROTTLE_DELAY: 5000,       // Minimum between fetches
    CLEANUP_INTERVAL: 1000,     // Cleanup runs every second
    ALERT_CLEANUP_THRESHOLD: 3600000,  // 1 hour
    TELEMETRY_CLEANUP_THRESHOLD: 60000, // 1 minute (EXACT staleness threshold)
} as const;

/**
 * Map symbol scaling stops
 * EXACT values from MapLibre layer config
 */
export const SYMBOL_SCALING = {
    STOPS: [[1, 0.1], [7, 1.25]] as [number, number][],
    WIND_ICON_SIZE: 0.675,
} as const;
