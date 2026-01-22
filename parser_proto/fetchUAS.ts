/**
 * Exact implementation of UAS zone fetching from utm.eans.ee
 * 
 * This is the OFFICIAL implementation - every "if" and space matters!
 */

export interface UASFetchOptions {
    browseTime?: Date;
    browseBuffer?: number;
    showLoading?: boolean;
}

export interface UASGeoJSON {
    type: 'FeatureCollection';
    features: UASFeature[];
}

export interface UASFeature {
    type: 'Feature';
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
    };
    properties: {
        name?: string;
        restriction: 'NO_RESTRICTION' | 'CONDITIONAL' | 'REQ_AUTHORISATION' | 'PROHIBITED';
        lowerMeters: number;
        upperMeters: number;
        hidden?: boolean;
        zoneId?: string;
        identifier?: string;
        reason?: string;
        [key: string]: any;
    };
}

/**
 * Fetches UAS zones from the official endpoint
 * 
 * EXACT implementation from main.js - DO NOT MODIFY
 */
export async function fetchUAS(
    options: UASFetchOptions = {}
): Promise<UASGeoJSON> {
    const { browseTime, browseBuffer, showLoading } = options;

    // Exact host configuration from window.ENV
    const HOST = window.ENV?.HOST || 'https://utm.eans.ee/avm/';

    // Build URL exactly as the original does
    let url = `${HOST}utm/uas.geojson`;

    // Add time filtering if browsing historical/future data
    if (browseTime) {
        const start = browseTime;
        const end = browseTime;
        url += `?start=${start.toISOString()}&end=${end.toISOString()}&buffer=${browseBuffer || 0}`;
    }

    // Fetch with error handling exactly as original
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const geoJsonData: UASGeoJSON = await response.json();

        return geoJsonData;
    } catch (error) {
        console.error('Failed to fetch UAS zones:', error);
        throw error;
    }
}

/**
 * Updates MapLibre source with UAS data
 * 
 * This is how the original updates the map
 */
export function updateUASSource(
    map: any, // maplibregl.Map
    geoJsonData: UASGeoJSON
): void {
    const source = map.getSource('uas');
    if (source) {
        source.setData(geoJsonData);
    }
}
