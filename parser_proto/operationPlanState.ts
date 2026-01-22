/**
 * EXACT Operation Plan State Logic from utm.eans.ee
 * 
 * This file contains the COMPLETE state determination logic for
 * operation plans, including all edge cases for completed, cancelled,
 * and rejected statuses.
 */

/**
 * Operation Plan states
 */
export type OperationPlanState =
    | 'PROPOSED'
    | 'APPROVED'
    | 'AUTHORIZED'
    | 'ACTIVATED'
    | 'TAKEOFFREQUESTED'
    | 'TAKEOFFGRANTED'
    | 'CLOSED'
    | 'DENIED'
    | 'TIMEOUT'
    | 'ERROR';

/**
 * Closure reasons
 */
export type ClosureReason =
    | 'NOMINAL'
    | 'CANCELED'
    | 'WITHDRAWN'
    | 'REJECTED'
    | 'REVOKED'
    | 'TIMEOUT'
    | null;

/**
 * Authorization/Activation state
 */
export type GrantState = 'GRANTED' | 'DENIED' | 'PENDING' | null;

/**
 * Operation Plan data structure (relevant fields)
 */
export interface OperationPlanData {
    operationPlanId: string;
    state: OperationPlanState;
    closureReason?: ClosureReason;
    authorization?: {
        state: GrantState;
    };
    activation?: {
        state: GrantState;
    };
    alternativeOPs?: Array<{
        timeBegin: string;
    }>;
    conflicts?: Array<any>;
    timeBegin: string;
}

/**
 * Computed status for display
 */
export interface ComputedOperationPlanStatus {
    completed: boolean;
    cancelled: boolean;
    rejected: boolean;
    active: boolean;
    pending: boolean;
}

/**
 * Determine if operation plan is "completed"
 * EXACT logic from utm.eans.ee
 * 
 * Completed means:
 * 1. CLOSED with NOMINAL closure reason, OR
 * 2. CLOSED with both authorization AND activation GRANTED
 */
export function isCompleted(plan: OperationPlanData): boolean {
    if (plan.state !== 'CLOSED') {
        return false;
    }

    // Case 1: Nominal closure
    if (plan.closureReason === 'NOMINAL') {
        return true;
    }

    // Case 2: Both authorization and activation granted
    if (
        plan.authorization?.state === 'GRANTED' &&
        plan.activation?.state === 'GRANTED'
    ) {
        return true;
    }

    return false;
}

/**
 * Determine if operation plan is "rejected"
 * EXACT logic from utm.eans.ee
 * 
 * Rejected means:
 * 1. Has alternativeOPs with different timeBegin (time conflict), OR
 * 2. State is DENIED with conflicts, OR
 * 3. State is TIMEOUT or ERROR
 */
export function isRejected(plan: OperationPlanData): boolean {
    // Case 1: Alternative OPs with different time
    if (plan.alternativeOPs && plan.alternativeOPs.length > 0) {
        const hasTimeMismatch = plan.alternativeOPs.some(
            alt => alt.timeBegin !== plan.timeBegin
        );
        if (hasTimeMismatch) {
            return true;
        }
    }

    // Case 2: DENIED with conflicts
    if (plan.state === 'DENIED' && plan.conflicts && plan.conflicts.length > 0) {
        return true;
    }

    // Case 3: TIMEOUT or ERROR states
    if (plan.state === 'TIMEOUT' || plan.state === 'ERROR') {
        return true;
    }

    return false;
}

/**
 * Determine if operation plan is "cancelled"
 * EXACT logic from utm.eans.ee
 * 
 * Cancelled means:
 * 1. closureReason is CANCELED or WITHDRAWN, OR
 * 2. CLOSED but not completed and not rejected
 */
export function isCancelled(plan: OperationPlanData): boolean {
    // Case 1: Explicit cancellation reasons
    if (
        plan.closureReason === 'CANCELED' ||
        plan.closureReason === 'WITHDRAWN'
    ) {
        return true;
    }

    // Case 2: CLOSED but not completed and not rejected
    if (plan.state === 'CLOSED') {
        const completed = isCompleted(plan);
        const rejected = isRejected(plan);

        if (!completed && !rejected) {
            return true;
        }
    }

    return false;
}

/**
 * Determine if operation plan is active
 */
export function isActive(plan: OperationPlanData): boolean {
    return plan.state === 'ACTIVATED';
}

/**
 * Determine if operation plan is pending (awaiting approval)
 */
export function isPending(plan: OperationPlanData): boolean {
    return plan.state === 'PROPOSED' || plan.state === 'APPROVED';
}

/**
 * Get complete computed status
 * EXACT logic matching utm.eans.ee defineProperties pattern
 */
export function getComputedStatus(plan: OperationPlanData): ComputedOperationPlanStatus {
    return {
        completed: isCompleted(plan),
        cancelled: isCancelled(plan),
        rejected: isRejected(plan),
        active: isActive(plan),
        pending: isPending(plan),
    };
}

/**
 * State priority for sorting
 * EXACT values from utm.eans.ee
 */
export const STATE_PRIORITY: Record<string, number> = {
    'ACTIVATED': 5,
    'TAKEOFFREQUESTED': 4,
    'APPROVED': 3,
    'PROPOSED': 2,
    'CLOSED': 1,
    // Default for unknown states: -1
};

/**
 * Get state priority (with default)
 */
export function getStatePriority(state: string): number {
    return STATE_PRIORITY[state] ?? -1;  // EXACT: Unknown states get -1
}

/**
 * Source priority for sorting
 * EXACT values from utm.eans.ee (with default)
 */
export const SOURCE_PRIORITY: Record<string, number> = {
    'coordinate': 3,           // User-drawn zones
    'operationplans': 2,
    'weather-observations': 1,
    // Default for unknown sources: -1
};

/**
 * Get source priority (with default)
 */
export function getSourcePriority(source: string): number {
    return SOURCE_PRIORITY[source] ?? -1;  // EXACT: Unknown sources get -1
}

/**
 * Restriction priority for sorting
 * EXACT values from utm.eans.ee
 */
export const RESTRICTION_PRIORITY: Record<string, number> = {
    'NO_RESTRICTION': 0,
    'CONDITIONAL': 1,
    'REQ_AUTHORISATION': 2,
    'PROHIBITED': 3,
    // Default: 0
};

/**
 * Get restriction priority
 * Note: _rejecting features are forced to 3 (PROHIBITED level)
 */
export function getRestrictionPriority(
    restriction: string,
    isRejecting: boolean = false
): number {
    if (isRejecting) {
        return 3;  // EXACT: Rejecting features get highest severity
    }
    return RESTRICTION_PRIORITY[restriction] ?? 0;
}

/**
 * Error message mapping
 * EXACT strings that are caught and translated
 */
export const ERROR_MESSAGE_MAPPING: Record<string, string> = {
    'end time has been exceeded': 'operationplan.exceeded',
    'VLOS': 'operationplan.vlos_bbox_exceeded',  // Combined with 'bounding box'
};

/**
 * Check if error should be translated
 */
export function shouldTranslateError(errorMessage: string): string | null {
    if (errorMessage.includes('end time has been exceeded')) {
        return 'operationplan.exceeded';
    }

    if (errorMessage.includes('VLOS') && errorMessage.includes('bounding box')) {
        return 'operationplan.vlos_bbox_exceeded';
    }

    return null;
}
