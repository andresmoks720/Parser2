# Rules

## R1: Restriction Derivation
**Decision Table**
| Condition | Output `restriction` | Example IDs |
| --- | --- | --- |
| `reason === "Sensitive"` | `PROHIBITED` | EX-RESTRICTION-01 |
| `reason` is truthy and `reason !== "Other"` | `REQ_AUTHORISATION` | EX-RESTRICTION-02 |
| Otherwise | `properties.restriction` or default `NO_RESTRICTION` | EX-RESTRICTION-03 |

**Precedence**
1. `reason === "Sensitive"` overrides any `properties.restriction` value.
2. Other non-`"Other"` reasons override `properties.restriction`.
3. Only if `reason` is missing or `"Other"` does `properties.restriction` apply.

## R2: Restriction Level Mapping
| Restriction | Level | Example IDs |
| --- | --- | --- |
| `NO_RESTRICTION` | `0` | EX-LEVEL-01 |
| `REQ_AUTHORISATION` | `1` | EX-LEVEL-02 |
| `PROHIBITED` | `2` | EX-LEVEL-03 |

## R3: Localized Message Resolution
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| `lang` is falsy | `properties.message` or `null` | EX-MESSAGE-01 |
| `localizedMessages` contains entry where `language` starts with `${lang}-` | That `message` | EX-MESSAGE-02 |
| Otherwise | `properties.message` or `null` | EX-MESSAGE-03 |

## R4: Geometry Containment
**Decision Table (Polygon)**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Point inside exterior ring and not in any hole | `true` | EX-GEO-01 |
| Point outside exterior ring | `false` | EX-GEO-02 |
| Point inside any hole ring | `false` | EX-GEO-03 |

**Decision Table (MultiPolygon)**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Point inside at least one polygon exterior and not inside any hole | `true` | EX-GEO-04 |
| Otherwise | `false` | EX-GEO-05 |

## R5: Violation Check
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Point not in feature | `null` | EX-VIOLATION-01 |
| Point in feature, but `alt < lower` or `alt > upper` | `null` | EX-VIOLATION-02 |
| Point in feature and within altitude range | Violation object (`zoneId`, `zoneName`, `restriction`, `restrictionLevel`) | EX-VIOLATION-03 |

**Altitude Normalization**
- `lower`: `"AGL"` ⇒ `0` for the purpose of comparison.
- `upper`: `null` ⇒ `Infinity` for the purpose of comparison.

## R6: Feature Filtering
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| `properties.identifier` is `EERZout` or `EYVLOUT` | Feature excluded | EX-FILTER-01 |
| Otherwise | Feature included | EX-FILTER-02 |

## R7: Styling
**Decision Table**
| Restriction | Color | Example IDs |
| --- | --- | --- |
| `PROHIBITED` | `#d44` | EX-STYLE-01 |
| `REQ_AUTHORISATION` | `#88d` | EX-STYLE-02 |
| `NO_RESTRICTION` or other | `#0004` (base style) | EX-STYLE-03 |

**Base Style** (always applied)
- `fillOpacity: 0`
- `weight: 2`
- `opacity: 0.8`
- `className: "interactive-no-pointer"`

## R8: Feature Transformation (Unified Airspace Schema)
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| `identifier` matches `/^[A-Z]{4}\d+/` | `properties.source = "EAIP"` | EX-TRANSFORM-01 |
| Otherwise | `properties.source = "UAS_ZONE"` | EX-TRANSFORM-02 |
| `restriction === "PROHIBITED"` | `properties.priority = "HIGH"` | EX-TRANSFORM-03 |
| Otherwise | `properties.priority = "LOW"` | EX-TRANSFORM-04 |

## R9: Altitude Parsing for Transformation (`parseAlt`)
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| `val` is `null`, `"AGL"`, or `"SFC"` | `{ value: 0, unit: "FT", referenceDatum: "SFC" }` | EX-PARSEALT-01 |
| `val` parses to a number | `{ value: <number>, unit: "FT", referenceDatum: "AMSL" }` | EX-PARSEALT-02 |
| Otherwise | `{ value: 0, unit: "FT", referenceDatum: <defaultRef> }` | EX-PARSEALT-03 |

## R10: Acquisition Scheduling by Source Type
**Decision Table**
| Source Type | Frequency | Priority | Retry Logic | Example IDs |
| --- | --- | --- | --- | --- |
| `ICAO_GLOBAL` | Every 5 min | High | Exponential | EX-ACQ-SCHED-01 |
| `NATIONAL_AUTHORITY` | Every 2 min | Critical | Immediate | EX-ACQ-SCHED-02 |
| `MILITARY_EXERCISES` | Every 1 min | Critical | Immediate | EX-ACQ-SCHED-03 |
| `EMERGENCY_NOTICES` | Real-time | Maximum | Immediate | EX-ACQ-SCHED-04 |
| `FACILITY_CHANGES` | Every 10 min | Medium | Linear | EX-ACQ-SCHED-05 |
| `WEATHER_HAZARDS` | Every 3 min | High | Exponential | EX-ACQ-SCHED-06 |

## R11: Acquisition Workflow Ordering
**Decision Table**
| Condition | Output (Ordered Steps) | Example IDs |
| --- | --- | --- |
| Source registered and enabled | `Source Discovery → Request Scheduling → Data Retrieval → Quality Assurance` | EX-ACQ-WF-01 |

## R12: Parsing & Validation Pipeline Stages
**Decision Table**
| Condition | Output (Ordered Stages) | Example IDs |
| --- | --- | --- |
| Raw NOTAM payload received | `Format Detection → Field Extraction → Structure Validation → Content Analysis → Enhancement & Enrichment` | EX-PARSE-PIPE-01 |

## R13: Emergency Acquisition Protocol
**Decision Table**
| Trigger | Output (Ordered Actions) | Example IDs |
| --- | --- | --- |
| Emergency declared / keywords detected | `Immediate Acquisition → Priority Processing → Real-time Distribution → Client Notification` | EX-EMERGENCY-01 |

## R14: Credential Rotation and Failover
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Primary credential expires or fails | Switch to backup authentication method; continue acquisition | EX-CRED-FAILOVER-01 |
| Credential nearing expiration | Proactively rotate or refresh before expiry | EX-CRED-ROTATE-01 |

## R15: Format Evolution Handling
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| New field detected in payload | Analyze content to classify as new info vs. restructure of existing data | EX-FORMAT-CHANGE-01 |
| Format changes detected | Adapt parser to new structure without halting acquisition | EX-FORMAT-CHANGE-02 |

## R16: Retry Backoff Selection
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Failure on critical source (e.g., emergency/military) | Increase retry frequency | EX-RETRY-CRITICAL-01 |
| Routine maintenance or non-critical source | Reduce retry frequency to avoid overload | EX-RETRY-NONCRIT-01 |
| General failure with exponential policy | Apply exponential backoff | EX-RETRY-EXP-01 |

## R17: Emergency Multi-Source Acquisition
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Emergency keywords detected | Activate parallel acquisition (email/API/broadcast/social) and deduplicate related NOTAMs | EX-EMERGENCY-MULTI-01 |
| Emergency related to runway closure | Increase polling for airport sources and reduce non-critical sources | EX-EMERGENCY-BOOST-01 |

## R18: Format Detection
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| ICAO standard format detected | Tag payload as `ICAO_STANDARD` and proceed to extraction | EX-FORMAT-ICAO-01 |
| Legacy format detected | Tag payload as `LEGACY` and proceed to extraction | EX-FORMAT-LEGACY-01 |
| Emergency format detected | Tag payload as `EMERGENCY` and proceed to extraction | EX-FORMAT-EMERGENCY-01 |
| Multi-language content detected | Record language metadata for downstream localization | EX-FORMAT-MULTILANG-01 |

## R19: Field Extraction
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Payload parsed | Extract header information (number, type, location indicator, issue time, effective period, authority) | EX-EXTRACT-HEADER-01 |
| Payload parsed | Extract location coordinates and altitude limits | EX-EXTRACT-LOC-01 |
| Payload parsed | Extract time restrictions, affected facilities, and contact information | EX-EXTRACT-DETAILS-01 |

## R20: Structure Validation
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Required fields missing | Validation fails with missing-field error | EX-VALIDATE-REQ-01 |
| Data types inconsistent | Validation fails with type error | EX-VALIDATE-TYPE-01 |
| Coordinates malformed | Validation fails with coordinate error | EX-VALIDATE-COORD-01 |
| Timestamps out of range | Validation fails with time-range error | EX-VALIDATE-TIME-01 |
| Authority credentials invalid | Validation fails with credential error | EX-VALIDATE-AUTH-01 |

## R21: Content Analysis
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Keywords detected | Classify NOTAM category/keywords | EX-ANALYZE-KEYWORD-01 |
| Severity criteria met | Assign severity level | EX-ANALYZE-SEVERITY-01 |
| Geometry and scope known | Calculate impact area | EX-ANALYZE-IMPACT-01 |
| Operations referenced | Identify affected operations | EX-ANALYZE-OPS-01 |
| Requirements described | Extract special requirements | EX-ANALYZE-REQ-01 |

## R22: Enhancement & Enrichment
**Decision Table**
| Condition | Output | Example IDs |
| --- | --- | --- |
| Record validated | Assign geographic coordinates and projections | EX-ENRICH-GEO-01 |
| Record validated | Determine visual style for map display | EX-ENRICH-STYLE-01 |
| Record validated | Assign priority level and alert thresholds | EX-ENRICH-PRIORITY-01 |
| Record validated | Cross-reference related records | EX-ENRICH-XREF-01 |

## Defaults
- `restriction` defaults to `NO_RESTRICTION` if no override applies.
- `lower` defaults to `"AGL"`, `upper` defaults to `null`.
- `schedule` defaults to `{ isPermanent: true, text: "Permanent" }`.
- `class` defaults to `"UNCLASSIFIED"`.
- `contact` defaults to `null`.

## Codex-Assisted Spec Tightening (Non-normative)
When using Codex to tighten the spec, ensure it:
- Finds missing branches in decision tables based on the Phase 1 examples.
- Proposes additional edge cases for manual review.
- Checks that all error outcomes are covered by scenarios.

Based on the Phase 1 decision tables and examples, the following coverage notes were identified:
- Geometry types other than `Polygon`/`MultiPolygon` fall through to `false` for containment; no explicit example covers this branch. (Uncovered branch; should be tested.)
