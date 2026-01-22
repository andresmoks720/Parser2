/**
 * Logic for parsing and styling UAS GeoJSON data (NOTAMs/Air Zones).
 * Extracted from _app/immutable/nodes/4.CB2fylc3.js
 */

const restrictionLevels = {
    NO_RESTRICTION: 0,
    REQ_AUTHORISATION: 1,
    PROHIBITED: 2
};

class AirZone {
    constructor(feature) {
        this.feature = feature;
    }

    get restriction() {
        const props = this.feature?.properties || {};
        let restriction = props.restriction || 'NO_RESTRICTION';

        if (props.reason === 'Sensitive') {
            restriction = 'PROHIBITED';
        } else if (props.reason !== 'Other' && props.reason) {
            restriction = 'REQ_AUTHORISATION';
        }

        return restriction;
    }

    get restrictionLevel() {
        return restrictionLevels[this.restriction] || restrictionLevels.NO_RESTRICTION;
    }

    get reason() {
        const reason = this.feature?.properties?.reason || null;
        return reason === 'Other' ? null : reason;
    }

    get lower() {
        return this.feature?.properties?.lower || 'AGL';
    }

    get upper() {
        return this.feature?.properties?.upper || null;
    }

    get name() {
        return this.feature?.properties?.name || null;
    }

    get identifier() {
        return this.feature?.properties?.identifier || null;
    }

    /**
     * Get message based on language preference.
     * @param {string} lang - Language code (e.g., 'et', 'en')
     */
    getLocalisedMessage(lang) {
        const props = this.feature?.properties || {};
        if (!lang) return props.message || null;

        const localizedMessages = props.extendedProperties?.localizedMessages;
        const localized = localizedMessages?.find(m => m.language.startsWith(lang + '-'));

        return localized?.message || props.message || null;
    }

    /**
     * Check if a position (lat, lng, alt) violates this air zone.
     * @param {object} pos - {lat, lng, alt}
     * @returns {object|null} - Violation details or null
     */
    checkViolation(pos) {
        if (!isPointInFeature([pos.lng, pos.lat], this.feature)) {
            return null;
        }

        // Check altitude
        const lower = this.lower === 'AGL' ? 0 : parseFloat(this.lower);
        const upper = this.upper === null ? Infinity : parseFloat(this.upper);

        // Note: We don't have ground elevation here so AGL is treated as 0 AMSL for now.
        // In a real system, we would subtract terrain height if lower is AGL.

        if (pos.alt < lower || pos.alt > upper) {
            return null;
        }

        return {
            zoneId: this.identifier,
            zoneName: this.name,
            restriction: this.restriction,
            restrictionLevel: this.restrictionLevel
        };
    }
}

/**
 * Robust point-in-polygon implementation.
 * @param {Array} point - [lng, lat]
 * @param {Array} polygon - Array of rings [[lng, lat], ...]
 */
function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > point[1]) !== (yj > point[1]))
            && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Check if a point is within a GeoJSON Feature (Polygon or MultiPolygon).
 */
function isPointInFeature(point, feature) {
    if (!feature || !feature.geometry) return false;
    const { type, coordinates } = feature.geometry;

    if (type === 'Polygon') {
        // First ring is exterior, subsequent are holes
        if (!isPointInPolygon(point, coordinates[0])) return false;
        for (let i = 1; i < coordinates.length; i++) {
            if (isPointInPolygon(point, coordinates[i])) return false;
        }
        return true;
    } else if (type === 'MultiPolygon') {
        for (const polygonCoords of coordinates) {
            let inside = isPointInPolygon(point, polygonCoords[0]);
            if (inside) {
                let inHole = false;
                for (let i = 1; i < polygonCoords.length; i++) {
                    if (isPointInPolygon(point, polygonCoords[i])) {
                        inHole = true;
                        break;
                    }
                }
                if (!inHole) return true;
            }
        }
    }
    return false;
}

const excludedIdentifiers = ["EERZout", "EYVLOUT"];

/**
 * Styles a GeoJSON feature for a Leaflet layer.
 * @param {object} feature 
 * @returns {object} Leaflet style object
 */
function getAirZoneStyle(feature) {
    const zone = new AirZone(feature);
    const baseStyle = {
        fillOpacity: 0,
        color: "#0004",
        weight: 2,
        opacity: .8,
        className: "interactive-no-pointer"
    };

    if (zone.restriction === "PROHIBITED") {
        return { ...baseStyle, color: "#d44" };
    } else if (zone.restriction === "REQ_AUTHORISATION") {
        return { ...baseStyle, color: "#88d" };
    }

    return baseStyle;
}

/**
 * Filter and prepare GeoJSON data.
 * @param {object} data - GeoJSON FeatureCollection
 */
function prepareAirZones(data) {
    return {
        type: "FeatureCollection",
        features: (data.features || []).filter(f => {
            if (f.properties && f.properties.identifier) {
                return !excludedIdentifiers.includes(f.properties.identifier);
            }
            return true;
        })
    };
}

/**
 * Transforms a raw GeoJSON feature into the Unified Airspace Schema format.
 * @param {object} rawFeature 
 * @returns {object} Schema-compliant Feature
 */
function transformFeature(rawFeature) {
    const zone = new AirZone(rawFeature);
    const props = rawFeature.properties || {};

    // Helper to parse altitude string "1000 FT AMSL" or similar if needed, 
    // but current getters just return simple values. Use safe defaults for now.
    const parseAlt = (val, defaultRef) => {
        if (!val || val === 'AGL' || val === 'SFC') return { value: 0, unit: 'FT', referenceDatum: 'SFC' };
        // If it's a number, assume FT AMSL for now unless specified
        const num = parseFloat(val);
        if (!isNaN(num)) return { value: num, unit: 'FT', referenceDatum: 'AMSL' };
        return { value: 0, unit: 'FT', referenceDatum: defaultRef };
    };

    return {
        type: "Feature",
        id: zone.identifier,
        geometry: rawFeature.geometry,
        properties: {
            source: props.identifier && props.identifier.match(/^[A-Z]{4}\d+/) ? "EAIP" : "UAS_ZONE", // Simple heuristic
            identifier: zone.identifier,
            name: zone.name,
            class: "UNCLASSIFIED",
            restriction: zone.restriction, // Already normalized by AirZone class
            lowerLimit: parseAlt(zone.lower, 'SFC'),
            upperLimit: parseAlt(zone.upper, 'AMSL'),
            schedule: {
                isPermanent: true, // Defaulting to true for uas.geojson
                text: "Permanent"
            },
            content: props.message || zone.name,
            extendedProperties: {
                localizedMessages: props.extendedProperties?.localizedMessages || []
            },
            priority: zone.restriction === 'PROHIBITED' ? 'HIGH' : 'LOW',
            contact: null
        }
    };
}

// Exports for use in the application or for documentation
if (typeof module !== 'undefined') {
    module.exports = {
        AirZone,
        getAirZoneStyle,
        prepareAirZones,
        isPointInPolygon,
        isPointInFeature,
        transformFeature
    };
}
