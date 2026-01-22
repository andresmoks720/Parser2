import * as turf from '@turf/turf';

/**
 * EXACT intersection logic from utm.eans.ee
 * 
 * Determines which restricted zones a proposed flight path intersects with.
 *
 * @param routeArea - The buffered flight path geometry
 * @param uasGeoJson - The collection of all restricted UAS zones
 */
/**
 * EXACT intersection logic from utm.eans.ee (getPlanFeatures)
 * 
 * Filters UAS zones that intersect with the proposed route.
 * Note: Performs 2D spatial filtering on the client; altitude conflicts are server-side.
 *
 * @param routeArea - The buffered flight path geometry
 * @param uasGeoJson - The collection of all restricted UAS zones
 */
export function getIntersectingZones(
    routeArea: GeoJSON.FeatureCollection,
    uasGeoJson: GeoJSON.FeatureCollection
): GeoJSON.Feature[] {
    if (!routeArea || !routeArea.features || routeArea.features.length === 0) {
        return [];
    }

    // 1. Consolidate drawing into a single unified geometry (EXACT loop from main.js)
    let unifiedArea: any = routeArea.features[0];
    for (let i = 1; i < routeArea.features.length; i++) {
        const nextFeature = routeArea.features[i];
        try {
            // EXACT: Uses union on a FeatureCollection of [n, a]
            unifiedArea = turf.union(turf.featureCollection([unifiedArea, nextFeature]));
        } catch (e) {
            // production silently skips broken unions
            continue;
        }
    }

    // 2. Perform intersection check (EXACT booleanIntersects check)
    return uasGeoJson.features.filter(zoneFeature => {
        try {
            return turf.booleanIntersects(turf.feature(zoneFeature.geometry), unifiedArea);
        } catch (e) {
            console.error('Intersection check failed:', e);
            return false;
        }
    });
}

/**
 * EXACT self-intersection detection (Invisible Logic)
 * 
 * Uses turf.kinks to identify if a polygon crosses itself.
 * Historically used in utm.eans.ee to trigger the 'draw.error.intersectingPolygon' alert.
 * 
 * @param geometry - The polygon geometry to check
 * @returns true if the polygon self-intersects
 */
export function hasSelfIntersection(geometry: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>): boolean {
    try {
        const kinks = turf.kinks(geometry);
        return kinks.features.length > 0;
    } catch (e) {
        // If geometry is so broken that kinks fails, consider it invalid
        return true;
    }
}

/**
 * Find zones at a specific coordinate
 * Used for point-and-click info boxes
 */
export function findZonesAtPoint(
    lngLat: { lng: number; lat: number },
    uasData: GeoJSON.FeatureCollection
): GeoJSON.Feature[] {
    const point = turf.point([lngLat.lng, lngLat.lat]);

    return uasData.features.filter(feature => {
        // EXACT check: skip hidden features
        if (feature.properties?.hidden) {
            return false;
        }

        try {
            return turf.booleanPointInPolygon(point, feature as any);
        } catch (e) {
            return false;
        }
    });
}
