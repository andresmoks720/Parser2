# State Machine

The acquisition and distribution pipeline is stateful as documented in Phase 1 artifacts. The parsing and AirZone evaluation functions remain pure, but acquisition scheduling and emergency handling follow ordered states.

## States
| State | Description |
| --- | --- |
| `Idle` | No scheduled fetch in progress. |
| `Scheduled` | Source is queued based on schedule/policy. |
| `Fetching` | Requests in flight to an authority source. |
| `Validating` | Responses undergoing format verification and QA. |
| `Publishing` | Validated/enhanced records distributed to clients/subsystems. |
| `Retrying` | Backoff/retry in progress after failure. |
| `EmergencyBoost` | Emergency-triggered acquisition and distribution loop. |

## Events
| Event | Description |
| --- | --- |
| `SourceRegistered` | Source configuration added/updated. |
| `ScheduleTick` | Schedule interval elapsed for a source. |
| `FetchSucceeded` | Data retrieved successfully. |
| `FetchFailed` | Retrieval failed or timed out. |
| `ValidationPassed` | QA/validation succeeded. |
| `ValidationFailed` | QA/validation failed. |
| `EmergencyDetected` | Emergency trigger/keyword detected. |
| `DistributionComplete` | Downstream consumers updated. |

## Transitions
| From | Event | Guard | To | Action |
| --- | --- | --- | --- | --- |
| `Idle` | `SourceRegistered` | Source enabled | `Scheduled` | Queue source for schedule. |
| `Scheduled` | `ScheduleTick` | — | `Fetching` | Execute request(s). |
| `Fetching` | `FetchSucceeded` | — | `Validating` | Run QA/format checks. |
| `Fetching` | `FetchFailed` | — | `Retrying` | Apply retry policy per source type. |
| `Validating` | `ValidationPassed` | — | `Publishing` | Enrich and distribute records. |
| `Validating` | `ValidationFailed` | — | `Retrying` | Apply retry policy per source type. |
| `Publishing` | `DistributionComplete` | — | `Scheduled` | Wait for next schedule tick. |
| `Any` | `EmergencyDetected` | — | `EmergencyBoost` | Trigger immediate acquisition and distribution. |
| `EmergencyBoost` | `DistributionComplete` | — | `Scheduled` | Resume normal scheduling. |

## Timeouts and Retry Semantics
- Retry behavior follows the acquisition schedule table (Immediate/Linear/Exponential) per source type.
- Emergency detection triggers immediate acquisition and priority processing, followed by real-time distribution and client notification.
