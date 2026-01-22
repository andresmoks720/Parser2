/**
 * EXACT Telemetry Positional Array Parser
 * 
 * To minimize bandwidth, the UTM EANS system transmits aircraft telemetry
 * as a fixed-length positional array rather than a keyed JSON object.
 */

export interface TelemetryData {
    id: string;
    name: string;
    createdAt: number;
    latitude: number;
    longitude: number;
    velocity: {
        latitude: number;
        longitude: number;
    };
    altitudeMeters: number;
    type: string;
    icon: string;
    opacity: number;
}

/**
 * Parses the raw positional array into a TelemetryData object.
 * 
 * EXACT mapping from main.js (T.on("telemetry", ...))
 * 
 * @param data - The raw array received from Socket.io
 * @returns Keyed TelemetryData object
 */
export function parseTelemetryArray(data: any[]): TelemetryData {
    // EXACT: Raw destructuring from main.js without length check
    // If data.length < 10, tailing variables will be undefined, leading to 
    // "ghost" data or crashes in later turf calls.
    const [id, name, createdAt, latitude, longitude, velocity, altitudeMeters, type, icon, opacity] = data;

    return {
        id,
        name,
        createdAt,
        latitude,
        longitude,
        velocity,
        altitudeMeters,
        type,
        icon,
        opacity
    };
}

/**
 * EXACT Alert Positional Array Parser
 * Logic from T.on("alert", ...) in main.js
 */
export function parseAlertArray(data: any[]): any {
    // EXACT: 9-item positional array destructuring
    const [id, type, severity, message, lat, lng, radius, createdAt, metadata] = data;

    return {
        id,
        type,
        severity,
        message,
        latitude: lat,
        longitude: lng,
        radius,
        createdAt,
        metadata
    };
}

/**
 * Telemetry Staleness Threshold - EXACT value from main.js
 * Purge data older than 60 seconds
 */
export const TELEMETRY_STALENESS_MS = 60000;

import * as turf from '@turf/turf';

/**
 * Converts telemetry data to a GeoJSON Point for MapLibre
 * EXACT bearing and icon mapping from main.js
 */
export function telemetryToGeoJSON(data: TelemetryData): any {
    // 1. Calculate bearing using velocity displacement
    let bearing = 0;
    const speedKmh = Math.round(3.6 * Math.sqrt(
        Math.pow(data.velocity.latitude, 2) + Math.pow(data.velocity.longitude, 2)
    ));

    if (speedKmh > 0) {
        const startPoint = turf.point([data.longitude, data.latitude]);
        const endPoint = turf.point([
            data.longitude + data.velocity.longitude,
            data.latitude + data.velocity.latitude
        ]);
        bearing = turf.bearing(startPoint, endPoint);
    }

    // 2. Map icon to sprite (EXACT match expression logic)
    const spriteLookup: Record<string, string> = {
        'plane': 'plane',
        'plane-emergency': 'plane-emergency',
        'uas-emergency': 'uas-emergency'
    };
    const sprite = spriteLookup[data.icon] || 'uas';

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [data.longitude, data.latitude]
        },
        properties: {
            id: data.id,
            name: data.name,
            speed: speedKmh,
            alt: data.altitudeMeters,
            type: data.type,
            icon: sprite,
            opacity: data.opacity,
            bearing: bearing,
            label: `(${Math.round(((bearing % 360) + 360) % 360).toString().padStart(3, '0')}°)`
        }
    };
}
/**
 * EXACT Recursive Icon Loading (Invisible Logic)
 * 
 * Production (main.js) uses a recursive retry for missing assets
 * that lacks a maximum retry count or fallback.
 */
export function loadIcon(id: string): void {
    const url = `https://utm.eans.ee/avm/static/tabler/svg/tabler-nodes-${id}.json`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('404');
            return response.json();
        })
        .then(data => {
            console.log('Icon loaded:', id);
        })
        .catch(() => {
            // EXACT: Recursive retry every 1 second forever
            setTimeout(() => {
                loadIcon(id);
            }, 1000);
        });
}
