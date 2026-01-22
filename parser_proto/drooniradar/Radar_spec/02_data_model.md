# Data Model

## GeoJSON Feature (Input)
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | string | Yes | Must be `"Feature"`. |
| `geometry.type` | string | Yes | `"Polygon"` or `"MultiPolygon"` supported for containment checks. |
| `geometry.coordinates` | array | Yes | Polygon rings or MultiPolygon rings. |
| `properties` | object | No | If missing, defaults are used. |

### `properties` (Raw)
| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `restriction` | string | `"NO_RESTRICTION"` | Overridden by `reason` rules. |
| `reason` | string | `null` | `"Sensitive"` and non-`"Other"` values alter restriction. |
| `lower` | string | `"AGL"` | Used for altitude checks and transform. |
| `upper` | string | `null` | Used for altitude checks and transform. |
| `name` | string | `null` | Display name. |
| `identifier` | string | `null` | Used for filtering and output IDs. |
| `message` | string | `null` | Base message fallback. |
| `extendedProperties.localizedMessages` | array | `[]` | Optional localized messages. |

## NOTAM Record (Structured Output of Parsing)
Derived from the “NOTAM Data Structure” fields documented in Phase 1 artifacts.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `number` | string | Yes | NOTAM number (`YYYYNNNAAA`). |
| `type` | string | Yes | `NOTAMN`, `NOTAMR`, or `NOTAMC`. |
| `locationIndicator` | string | Yes | ICAO location indicator. |
| `issueTime` | string (UTC timestamp) | Yes | Issue time in UTC. |
| `effectivePeriod` | object | Yes | `{ startTime, endTime }` UTC timestamps. |
| `authority` | string | Yes | Originating organization. |
| `description` | string | Yes | Free-text description. |
| `location` | object | No | Geographic coordinates for the notice. |
| `altitudeLimits` | object | No | `{ lower, upper, reference }` AGL/AMSL. |
| `timeRestrictions` | string/object | No | Days/hours of operation. |
| `affectedFacilities` | array | No | Airports, navaids, etc. |
| `contactInfo` | string/object | No | For clarification. |
| `severityLevel` | string | No | `Critical`/`High`/`Medium`/`Low`. |
| `flightImpact` | string | No | `Departures`/`Arrivals`/`Enroute`. |
| `aircraftTypes` | array | No | Commercial/Military/General. |
| `specialRequirements` | string | No | Clearances/restrictions. |

## Acquisition Source Configuration
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `sourceType` | string | Yes | ICAO, national, military, emergency, facility, weather. |
| `accessMethod` | string | Yes | REST API, direct API, secure API, or automated alerting. |
| `updateFrequency` | string | Yes | Frequency per source type (e.g., every 5 min). |
| `coverage` | string | Yes | Geographic/operational coverage. |
| `authMethod` | string | No | OAuth 2.0, API key, MFA, email-based renewal. |
| `credentialExpiry` | string (UTC timestamp) | No | Used for rotation checks. |
| `backupAuth` | object | No | Backup credentials/methods for failover. |
| `formatVersion` | string | No | Known source format version if provided. |

## Acquisition Metadata
| Field | Type | Notes |
| --- | --- | --- |
| `requestedAt` | string (UTC timestamp) | Time request initiated. |
| `receivedAt` | string (UTC timestamp) | Time response received. |
| `responseStatus` | string | HTTP or source status. |
| `retryCount` | number | Retries attempted. |
| `sourceId` | string | Authority/source identifier. |
| `formatDetected` | string | Detected format (ICAO/legacy/emergency). |

## AirZone (Normalized Accessors)
| Accessor | Type | Description |
| --- | --- | --- |
| `restriction` | string | Normalized restriction per rules. |
| `restrictionLevel` | number | `0` for `NO_RESTRICTION`, `1` for `REQ_AUTHORISATION`, `2` for `PROHIBITED`. |
| `reason` | string/null | Returns `null` if `reason === "Other"`. |
| `lower` | string | `properties.lower` or `"AGL"`. |
| `upper` | string/null | `properties.upper` or `null`. |
| `name` | string/null | `properties.name` or `null`. |
| `identifier` | string/null | `properties.identifier` or `null`. |

## Violation (Output)
| Field | Type | Notes |
| --- | --- | --- |
| `zoneId` | string/null | `identifier` from the AirZone. |
| `zoneName` | string/null | `name` from the AirZone. |
| `restriction` | string | Normalized restriction. |
| `restrictionLevel` | number | Mapped level. |

## Unified Airspace Schema Feature (Output of `transformFeature`)
| Field | Type | Notes |
| --- | --- | --- |
| `type` | string | Always `"Feature"`. |
| `id` | string/null | AirZone identifier. |
| `geometry` | object | From input feature. |
| `properties.source` | string | `"EAIP"` if identifier matches `/^[A-Z]{4}\d+/`, else `"UAS_ZONE"`. |
| `properties.identifier` | string/null | AirZone identifier. |
| `properties.name` | string/null | AirZone name. |
| `properties.class` | string | Always `"UNCLASSIFIED"`. |
| `properties.restriction` | string | Normalized restriction. |
| `properties.lowerLimit` | object | Parsed altitude (`value`, `unit`, `referenceDatum`). |
| `properties.upperLimit` | object | Parsed altitude (`value`, `unit`, `referenceDatum`). |
| `properties.schedule` | object | Defaulted to permanent. |
| `properties.content` | string | `properties.message` or `name`. |
| `properties.extendedProperties.localizedMessages` | array | Copied or empty array. |
| `properties.priority` | string | `"HIGH"` if `PROHIBITED`, else `"LOW"`. |
| `properties.contact` | null | Always `null` in Phase 1 logic. |

## Normalization Rules
- `reason === "Sensitive"` forces restriction to `PROHIBITED`.
- `reason` that is not `"Other"` and not empty forces restriction to `REQ_AUTHORISATION`.
- `reason === "Other"` yields `reason: null` in AirZone getter.
- `lower` defaults to `"AGL"`, `upper` defaults to `null`.
- No trimming, case folding, or rounding is performed in Phase 1 logic; inputs are compared exactly as provided. (Assumption: behavior is literal string comparison.)
- `parseAlt`:
  - `null`, `"AGL"`, or `"SFC"` ⇒ `{ value: 0, unit: "FT", referenceDatum: "SFC" }`.
  - Numeric string ⇒ `{ value: <number>, unit: "FT", referenceDatum: "AMSL" }`.
  - Non-numeric ⇒ `{ value: 0, unit: "FT", referenceDatum: <defaultRef> }`.
