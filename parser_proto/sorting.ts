/**
 * Sorting and Priority Logic - EXACT implementation from utm.eans.ee
 * 
 * sortFeatures() from main.js - sorts zones by priority
 * This is their OFFICIAL implementation!
 */

import type { UASFeature } from './fetchUAS';

type RestrictionType = 'NO_RESTRICTION' | 'CONDITIONAL' | 'REQ_AUTHORISATION' | 'PROHIBITED';

interface SortableFeature extends UASFeature {
    source?: string;
    properties: UASFeature['properties'] & {
        _rejecting?: boolean;
        state?: string;
    };
}

/**
 * Sorts UAS features by priority - EXACT 4-pass implementation from main.js
 * 
 * Hierarchy (from least to most significant in JS stable sort):
 * 1. Altitude (lower first)
 * 2. Restriction (Prohibited > Req. Auth > Conditional > No Restr)
 * 3. Source (Coordinate > Op Plans > Weather)
 * 4. State (Activated > Takeoff Requested > Approved > Proposed > Closed)
 * 
 * @param features - Array of features to sort in-place
 */
export function sortFeatures(features: SortableFeature[]): void {
    // PASS 1: Altitude (Least significant)
    features.sort((a, b) => {
        const r = a.properties.lowerMeters || 0;
        const a_alt = a.properties.upperMeters || 0;
        const o = b.properties.lowerMeters || 0;
        const s = b.properties.upperMeters || 0;
        return r === o ? a_alt - s : r - o;
    });

    // PASS 2: Restriction
    const restrictionPriority: Record<string, number> = {
        'NO_RESTRICTION': 0,
        'CONDITIONAL': 1,
        'REQ_AUTHORISATION': 2,
        'PROHIBITED': 3
    };
    features.sort((a, b) => {
        const r_a = a.properties.restriction || 'NO_RESTRICTION';
        const i_a = a.properties._rejecting;
        const o_b = b.properties.restriction || 'NO_RESTRICTION';
        const s_b = b.properties._rejecting;

        // Note: _rejecting flag pushes item to priority 3
        const priorityA = i_a ? 3 : (restrictionPriority[r_a] ?? 0);
        const priorityB = s_b ? 3 : (restrictionPriority[o_b] ?? 0);

        return priorityB - priorityA;
    });

    // PASS 3: Source
    const sourcePriority: Record<string, number> = {
        'coordinate': 3,
        'operationplans': 2,
        'weather-observations': 1
    };
    features.sort((a, b) => {
        const priorityA = sourcePriority[a.source || ''] || -1;
        const priorityB = sourcePriority[b.source || ''] || -1;
        return priorityB - priorityA;
    });

    // PASS 4: State (Most significant for Operation Plans)
    const statePriority: Record<string, number> = {
        'ACTIVATED': 5,
        'TAKEOFFREQUESTED': 4,
        'APPROVED': 3,
        'PROPOSED': 2,
        'CLOSED': 1
    };
    features.sort((a, b) => {
        if (a.source === 'operationplans' && b.source === 'operationplans') {
            const priorityA = statePriority[a.properties.state || ''] || -1;
            const priorityB = statePriority[b.properties.state || ''] || -1;
            return priorityB - priorityA;
        }
        return 0;
    });
}
