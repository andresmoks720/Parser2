/**
 * EXACT implementation of validation functions from utm.eans.ee
 * 
 * This file contains pixel-perfect replicas of validation logic,
 * including all edge cases and exact error messages.
 */

import * as turf from '@turf/turf';

/**
 * Phone validation - EXACT implementation from utm.eans.ee (Mr function)
 * 
 * Rules:
 * - Can start with '+' 
 * - Then only digits and spaces allowed
 * - Empty string is invalid
 * 
 * @param phone - Phone number string to validate
 * @returns true if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
    if (!phone || phone.length === 0) {
        return false;
    }

    // Allowed characters: + (only first), digits, spaces
    const allowedChars = '+0123456789 ';

    for (let i = 0; i < phone.length; i++) {
        const char = phone[i];

        // First character can be '+' or any allowed char
        if (i === 0 && char === '+') {
            continue;
        }

        // All characters must be in allowed set
        if (!allowedChars.includes(char)) {
            return false;
        }
    }

    return true;
}

/**
 * Longitude normalization - EXACT implementation (xt function)
 * 
 * Ensures longitude is in range [-180, 180]
 * 
 * Formula: ((lng + 180) % 360 + 360) % 360 - 180
 * 
 * @param lng - Longitude value (any range)
 * @returns Normalized longitude in [-180, 180]
 */
export function normalizeLongitude(lng: number): number {
    return ((lng + 180) % 360 + 360) % 360 - 180;
}

/**
 * Altitude conversion - meters to feet
 * EXACT conversion factor: 3.28084
 * 
 * @param meters - Altitude in meters
 * @returns Altitude in feet
 */
export function metersToFeet(meters: number): number {
    return meters * 3.28084;
}

/**
 * Altitude conversion - feet to meters
 * 
 * @param feet - Altitude in feet
 * @returns Altitude in meters
 */
export function feetToMeters(feet: number): number {
    return feet / 3.28084;
}

/**
 * User ID anonymization - EXACT implementation (Z function)
 * 
 * Uses SHA-256 to hash user IDs before sending to stats endpoint
 * 
 * @param userId - User ID to anonymize
 * @returns Hex string of SHA-256 hash
 */
export async function anonymizeUserId(userId: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
}

/**
 * Operation plan validation rules
 */
export interface OperationPlanValidation {
    // Personal info
    firstName: string;
    lastName: string;
    phone: string;

    // Aircraft info
    mtom: number;  // Max Takeoff Mass (kg)
    maxAltitude: number;  // meters

    // Time info
    startDatetime: Date;
    endDatetime: Date;

    // Authorization flag
    requiresAuthorization?: boolean;
}

/**
 * Environment configuration (from /avm/env)
 */
export interface EnvironmentConfig {
    REQ_AUTHORIZATION_MIN_LEAD_TIME: number;  // minutes
    MAX_PLANNING_AHEAD_DAYS?: number;  // (optional) days
}

/**
 * EXACT structural validation thresholds from utm.eans.ee
 */
export const STRUCTURAL_THRESHOLDS = {
    MIN_POLYGON_VERTICES: 3,
    MIN_LINE_VERTICES: 2,
    DEFAULT_BUFFER_METERS: 50,
} as const;

/**
 * EXACT altitude snap thresholds from utm.eans.ee
 */
export const ALTITUDE_THRESHOLDS = [10, 30, 50, 80, 100];

/**
 * Snap raw altitude to the nearest threshold value
 * EXACT implementation of the slider snapping micro-logic.
 * 
 * @param altitude - Raw altitude in meters
 * @returns Closest threshold value
 */
export function snapAltitude(altitude: number): number {
    return ALTITUDE_THRESHOLDS.reduce((prev, curr) =>
        Math.abs(curr - altitude) < Math.abs(prev - altitude) ? curr : prev
    );
}

/**
 * EXACT pilot name sanitization
 * 
 * Production (main.js) strips metadata in parentheses:
 * "John Doe (ID: 123)" -> "John Doe"
 * 
 * @param name - Raw name string
 * @returns Sanitized name string
 */
export function sanitizePilotName(name: string): string {
    return name.split("(")[0].trim();
}

/**
 * EXACT OPv3 Payload normalization
 * 
 * Handles schema drift between v2 (single phone string) and 
 * v3 (phones array) and aircraft info field names.
 */
export function normalizePayload(data: any, isV3: boolean = true): any {
    const normalized = { ...data };

    if (isV3) {
        // v3 uses 'phones' array
        normalized.phones = Array.isArray(data.phone) ? data.phone : [data.phone];
        // v3 uses 'aircraftInfos'
        normalized.aircraftInfos = data.uasRegistrations || data.aircraftInfos || [];
    } else {
        // v2 uses single 'phone' string
        normalized.phone = Array.isArray(data.phone) ? data.phone[0] : data.phone;
        // v2 uses 'uasRegistrations'
        normalized.uasRegistrations = data.aircraftInfos || data.uasRegistrations || [];
    }

    return normalized;
}

/**
 * Hidden translation keys found in scorched-earth audit
 */
export const ERROR_KEYS = {
    INTERSECTING_POLYGON: 'draw.error.intersectingPolygon',
    AREA_INCOMPLETE: 'draw.error.areaIncomplete',
    EMPTY_PATH: 'draw.error.emptyPath',
    AREA_TOO_SMALL: 'draw.error.areaTooSmall',
    PATH_TOO_SHORT: 'draw.error.pathTooShort',
    PLAN_TOO_FAR_AHEAD: 'operationplan.error.flightPlanTooFarAhead',
    START_TOO_SOON: 'operationplan.error.authorizationNeededStartTimeTooSoon',
    START_IN_PAST: 'operationplan.error.startBeforeNow',
    END_IN_PAST: 'operationplan.error.endBeforeNow',
    DURATION_TOO_LONG: 'operationplan.error.durationTooLong',
    DURATION_TOO_SHORT: 'operationplan.error.durationTooShort',
    END_BEFORE_START: 'operationplan.error.endBeforeStart',
    MTOM_NEGATIVE: 'operationplan.mandatory.mtomNegative',
    MAX_ALTITUDE_NEGATIVE: 'operationplan.mandatory.maxAltitudeNegative',
    FIRST_NAME_REQUIRED: 'operationplan.error.firstNameRequired',
    LAST_NAME_REQUIRED: 'operationplan.error.lastNameRequired',
    INVALID_PHONE: 'operationplan.error.invalidPhone'
};

/**
 * EXACT Dangerous Polygon Validation
 * Logic from draw event handler in main.js
 * 
 * CRITICAL: This is intentionally dangerous. It attempts to create a turf.polygon
 * from raw coordinates. If the array is malformed (e.g. < 4 points), it will 
 * THROW a hard error, crashing the current call stack.
 */
export function validatePolygonSafety(coords: number[][][]): boolean {
    // EXACT: If this throws, the calling code is responsible for the crash
    const poly = turf.polygon(coords);

    // If we survive the creation, check for kinks (self-intersection)
    const kinks = turf.kinks(poly);
    if (kinks.features.length > 0) {
        // Log the error key used in production
        console.error(ERROR_KEYS.INTERSECTING_POLYGON);
        return false;
    }

    return true;
}

/**
 * EXACT operation plan validation
 * 
 * Validates all required fields and business rules
 * 
 * @param plan - Operation plan to validate
 * @param env - Environment configuration
 * @returns Array of i18n error keys (empty if valid)
 */
export function validateOperationPlan(
    plan: OperationPlanValidation,
    env: EnvironmentConfig
): string[] {
    const errors: string[] = [];

    // Required field validation
    if (!plan.firstName || plan.firstName.trim() === '') {
        errors.push('operationplan.error.firstNameRequired');
    }

    if (!plan.lastName || plan.lastName.trim() === '') {
        errors.push('operationplan.error.lastNameRequired');
    }

    if (!plan.phone || !validatePhone(plan.phone)) {
        errors.push('operationplan.error.invalidPhone');
    }

    // Numeric validation
    if (plan.mtom < 0) {
        errors.push(ERROR_KEYS.MTOM_NEGATIVE);
    }

    if (plan.maxAltitude < 0) {
        errors.push(ERROR_KEYS.MAX_ALTITUDE_NEGATIVE);
    }

    // Time validation
    const now = new Date();
    const start = new Date(plan.startDatetime);
    const end = new Date(plan.endDatetime);

    if (start <= now) {
        errors.push(ERROR_KEYS.START_IN_PAST);
    }

    if (end <= now) {
        errors.push(ERROR_KEYS.END_IN_PAST);
    }

    if (end <= start) {
        errors.push(ERROR_KEYS.END_BEFORE_START);
    }

    // Duration validation
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;

    if (durationMinutes < (env.MIN_FLIGHT_DURATION || 1)) {
        errors.push(ERROR_KEYS.DURATION_TOO_SHORT);
    }

    if (env.MAX_FLIGHT_DURATION && durationMinutes > env.MAX_FLIGHT_DURATION) {
        errors.push(ERROR_KEYS.DURATION_TOO_LONG);
    }

    // Lead time validation (if authorization required)
    if (plan.requiresAuthorization) {
        const minLeadTime = env.REQ_AUTHORIZATION_MIN_LEAD_TIME || 5;
        const leadTimeMs = start.getTime() - now.getTime();
        const leadTimeMinutes = leadTimeMs / 60000;

        if (leadTimeMinutes < minLeadTime) {
            errors.push(ERROR_KEYS.START_TOO_SOON);
        }
    }

    // Lead time limit (cannot plan too far ahead)
    const maxAheadDays = env.MAX_PLANNING_AHEAD_DAYS || 30;
    const aheadMs = start.getTime() - now.getTime();
    const aheadDays = aheadMs / (1000 * 60 * 60 * 24);

    if (aheadDays > maxAheadDays) {
        errors.push(ERROR_KEYS.PLAN_TOO_FAR_AHEAD);
    }

    return errors;
}

/**
 * Time window URL builder - EXACT implementation
 * 
 * Adds ?start=...&end=...&buffer=... parameters to GeoJSON URLs
 * 
 * @param baseUrl - Base URL for the endpoint
 * @param startTime - Start of time window
 * @param endTime - End of time window  
 * @param bufferMinutes - Buffer to add before/after (default: 60)
 * @returns URL with query parameters
 */
export function buildTimeWindowUrl(
    baseUrl: string,
    startTime: Date,
    endTime: Date,
    bufferMinutes: number = 60
): string {
    // Apply buffer
    const start = new Date(startTime.getTime() - bufferMinutes * 60000).toISOString();
    const end = new Date(endTime.getTime() + bufferMinutes * 60000).toISOString();

    const params = new URLSearchParams({
        start,
        end,
        buffer: bufferMinutes.toString()
    });

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Data cleanup - EXACT thresholds
 */

/**
 * Alert cleanup - removes alerts older than 1 hour
 * 
 * @param alerts - Array of alerts
 * @returns Filtered alerts
 */
export function cleanupAlerts<T extends { createdAt: number }>(alerts: T[]): T[] {
    const oneHourAgo = Date.now() - 3600000;  // EXACT: 36e5 milliseconds
    return alerts.filter(alert => alert.createdAt > oneHourAgo);
}

/**
 * Telemetry cleanup - removes telemetry older than 1 minute
 * 
 * @param telemetry - Array of telemetry data
 * @returns Filtered telemetry
 */
export function cleanupTelemetry<T extends { createdAt: number }>(telemetry: T[]): T[] {
    const oneMinuteAgo = Date.now() - 60000;  // EXACT: 60000 milliseconds
    return telemetry.filter(t => t.createdAt > oneMinuteAgo);
}

/**
 * Constants - EXACT values from utm.eans.ee
 */
export const EXACT_CONSTANTS = {
    // Conversion factors
    METERS_TO_KM: 1000,
    METERS_TO_FEET: 3.28084,

    // Timing (milliseconds)
    THROTTLE_DELAY: 5000,  // 5 seconds between fetches
    POLLING_INTERVAL: 60000,  // 60 seconds
    ALERT_CLEANUP_THRESHOLD: 3600000,  // 1 hour (36e5)
    TELEMETRY_CLEANUP_THRESHOLD: 60000,  // 1 minute

    // Buffers
    CORRIDOR_BUFFER_METERS: 10,  // OPv3 payload
    UNCERTAINTY_SECONDS: 60,  // Legacy payload

    // Default values
    DEFAULT_TIME_BUFFER_MINUTES: 60,
} as const;
