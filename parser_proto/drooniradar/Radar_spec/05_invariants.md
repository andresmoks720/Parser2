# Invariants

- `restrictionLevel` must always be a numeric mapping of `restriction` with values `{NO_RESTRICTION: 0, REQ_AUTHORISATION: 1, PROHIBITED: 2}`.
- `getAirZoneStyle` must always include base style fields regardless of restriction.
- `prepareAirZones` must preserve feature order except for excluded identifiers.
- `transformFeature` must return a `Feature` with the same `geometry` as the input feature.
- `checkViolation` must return `null` unless both geometric containment and altitude range checks pass.
- `transformFeature` must always emit `lowerLimit.unit` and `upperLimit.unit` as `"FT"` based on the Phase 1 `parseAlt` logic.
- Acquisition always follows the ordered workflow: Source Discovery → Request Scheduling → Data Retrieval → Quality Assurance before distribution.
- Emergency acquisition always invokes Immediate Acquisition and Priority Processing before Real-time Distribution and Client Notification.
- Credential rotation and failover must not halt acquisition; a backup method must be attempted when primary auth fails.
- Format detection and adaptation occur before extraction; parsing must not stop on newly introduced fields.
- Field extraction must precede structure validation, which must precede content analysis and enrichment.

Performance constraints are not specified in Phase 1; no observable timing requirements are mandated.
