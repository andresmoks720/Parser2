# State Machine

> The system is largely stateless in these functions; the only explicit lifecycle is the **Operation Plan State** classification used for UI/status rendering.

## Operation Plan State (External Lifecycle)

### States
`PROPOSED → APPROVED → AUTHORIZED → TAKEOFFREQUESTED → TAKEOFFGRANTED → ACTIVATED → CLOSED`

Additional terminal/error states observed:
- `DENIED`
- `TIMEOUT`
- `ERROR`

### Events (Observed Fields)
- `state` changes (provided by backend).
- `closureReason` updates (e.g., `NOMINAL`, `CANCELED`, `WITHDRAWN`, `REJECTED`, `REVOKED`, `TIMEOUT`).
- `authorization.state` and `activation.state` updates.
- `alternativeOPs` updates with conflicting `timeBegin`.
- `conflicts` updates with non-empty array.

### Guards & Actions (Computed Status)
- **Completed**: `state === 'CLOSED'` and (`closureReason === 'NOMINAL'` OR both `authorization.state` and `activation.state` are `GRANTED`).
- **Rejected**: alternative OPs with different `timeBegin`, OR `state === 'DENIED'` with conflicts, OR `state` in `TIMEOUT | ERROR`.
- **Cancelled**: `closureReason` in `CANCELED | WITHDRAWN`, OR `state === 'CLOSED'` and not completed/rejected.
- **Active**: `state === 'ACTIVATED'`.
- **Pending**: `state` in `PROPOSED | APPROVED`.

### Timeouts & Retry Semantics
- No retries or timers are defined within these functions. Any timeout behavior is inferred from backend state (`TIMEOUT` state/closure reason) rather than client-side timers.
