# Traceability

This table links spec rules to Phase 1 observations in source artifacts. “Source” references are file-based observations (code/docs) and should be used to justify each rule.

## Phase 1 Example IDs
The example IDs used in `06_examples.feature` are derived from observed behavior in Phase 1 artifacts. Each ID below is tied to a concrete source observation to avoid inventing behavior.

| Example ID | Observation Summary | Legacy Observation Source |
| --- | --- | --- |
| EX-RESTRICTION-01 | `reason === "Sensitive"` yields `PROHIBITED`. | `parser/uasParser.js` (restriction getter logic) |
| EX-RESTRICTION-02 | Non-`"Other"` `reason` yields `REQ_AUTHORISATION`. | `parser/uasParser.js` (restriction getter logic) |
| EX-RESTRICTION-03 | Missing `reason` falls back to `properties.restriction` or default. | `parser/uasParser.js` (restriction getter logic) |
| EX-LEVEL-01 | `NO_RESTRICTION` maps to level `0`. | `parser/uasParser.js` (restrictionLevels mapping) |
| EX-LEVEL-02 | `REQ_AUTHORISATION` maps to level `1`. | `parser/uasParser.js` (restrictionLevels mapping) |
| EX-LEVEL-03 | `PROHIBITED` maps to level `2`. | `parser/uasParser.js` (restrictionLevels mapping) |
| EX-MESSAGE-01 | Missing `lang` returns base `properties.message`. | `parser/uasParser.js` (getLocalisedMessage) |
| EX-MESSAGE-02 | Matching `language` prefix returns localized message. | `parser/uasParser.js` (getLocalisedMessage) |
| EX-MESSAGE-03 | Non-matching `language` prefix falls back to base message. | `parser/uasParser.js` (getLocalisedMessage) |
| EX-GEO-01 | Polygon containment returns true for exterior and no holes. | `parser/uasParser.js` (isPointInPolygon/isPointInFeature) |
| EX-GEO-02 | Polygon containment returns false when outside exterior ring. | `parser/uasParser.js` (isPointInPolygon/isPointInFeature) |
| EX-GEO-03 | Polygon containment returns false when inside hole. | `parser/uasParser.js` (isPointInPolygon/isPointInFeature) |
| EX-GEO-04 | MultiPolygon containment returns true for any member without holes. | `parser/uasParser.js` (isPointInPolygon/isPointInFeature) |
| EX-GEO-05 | MultiPolygon containment returns false when no members match. | `parser/uasParser.js` (isPointInPolygon/isPointInFeature) |
| EX-VIOLATION-01 | Violation is null when point is outside geometry. | `parser/uasParser.js` (checkViolation) |
| EX-VIOLATION-02 | Violation is null when altitude is outside range. | `parser/uasParser.js` (checkViolation) |
| EX-VIOLATION-03 | Violation object returned when inside geometry and altitude. | `parser/uasParser.js` (checkViolation) |
| EX-FILTER-01 | Identifiers `EERZout`/`EYVLOUT` excluded. | `parser/uasParser.js` (prepareAirZones + excludedIdentifiers) |
| EX-FILTER-02 | Other identifiers included. | `parser/uasParser.js` (prepareAirZones) |
| EX-STYLE-01 | `PROHIBITED` uses color `#d44`. | `parser/uasParser.js` (getAirZoneStyle) |
| EX-STYLE-02 | `REQ_AUTHORISATION` uses color `#88d`. | `parser/uasParser.js` (getAirZoneStyle) |
| EX-STYLE-03 | Default uses base style color `#0004`. | `parser/uasParser.js` (getAirZoneStyle) |
| EX-TRANSFORM-01 | Identifier regex drives `source = "EAIP"`. | `parser/uasParser.js` (transformFeature) |
| EX-TRANSFORM-02 | Non-matching identifier drives `source = "UAS_ZONE"`. | `parser/uasParser.js` (transformFeature) |
| EX-TRANSFORM-03 | `PROHIBITED` drives `priority = "HIGH"`. | `parser/uasParser.js` (transformFeature) |
| EX-TRANSFORM-04 | Non-`PROHIBITED` drives `priority = "LOW"`. | `parser/uasParser.js` (transformFeature) |
| EX-PARSEALT-01 | `null`/`AGL`/`SFC` produces SFC reference with zero value. | `parser/uasParser.js` (parseAlt in transformFeature) |
| EX-PARSEALT-02 | Numeric string produces AMSL reference with numeric value. | `parser/uasParser.js` (parseAlt in transformFeature) |
| EX-PARSEALT-03 | Non-numeric string yields zero value with default reference. | `parser/uasParser.js` (parseAlt in transformFeature) |
| EX-ACQ-SCHED-01 | ICAO Global acquisition schedule (5 min, high, exponential). | `notams.md` (Acquisition Schedule table) |
| EX-ACQ-SCHED-02 | National authority acquisition schedule (2 min, critical, immediate). | `notams.md` (Acquisition Schedule table) |
| EX-ACQ-SCHED-03 | Military exercises acquisition schedule (1 min, critical, immediate). | `notams.md` (Acquisition Schedule table) |
| EX-ACQ-SCHED-04 | Emergency notices acquisition schedule (real-time, maximum, immediate). | `notams.md` (Acquisition Schedule table) |
| EX-ACQ-SCHED-05 | Facility changes acquisition schedule (10 min, medium, linear). | `notams.md` (Acquisition Schedule table) |
| EX-ACQ-SCHED-06 | Weather hazards acquisition schedule (3 min, high, exponential). | `notams.md` (Acquisition Schedule table) |
| EX-ACQ-WF-01 | Acquisition workflow ordering (discovery → scheduling → retrieval → QA). | `notams.md` (Acquisition Workflow) |
| EX-PARSE-PIPE-01 | Parsing pipeline stages (format → extraction → validation → analysis → enrichment). | `notams.md` (Parsing & Validation Pipeline) |
| EX-EMERGENCY-01 | Emergency protocol ordering (acquisition → processing → distribution → notification). | `notams.md` (Emergency Response) |
| EX-CRED-FAILOVER-01 | Primary auth failure uses backup credentials. | `notams.md` (Authentication and Credential Management Quirk) |
| EX-CRED-ROTATE-01 | Credential rotation/refresh before expiry. | `notams.md` (Authentication and Credential Management Quirk) |
| EX-FORMAT-CHANGE-01 | New field classified as new info vs. restructure. | `notams.md` (Data Format Evolution Challenge) |
| EX-FORMAT-CHANGE-02 | Parser adapts to format changes without manual intervention. | `notams.md` (Data Format Evolution Challenge) |
| EX-RETRY-CRITICAL-01 | Critical source increases retry frequency. | `notams.md` (Network Reliability and Retry Logic Sophistication) |
| EX-RETRY-NONCRIT-01 | Maintenance reduces retry frequency. | `notams.md` (Network Reliability and Retry Logic Sophistication) |
| EX-RETRY-EXP-01 | Exponential backoff behavior. | `notams.md` (Network Reliability and Retry Logic Sophistication) |
| EX-EMERGENCY-MULTI-01 | Parallel emergency acquisition and deduplication. | `notams.md` (Emergency Acquisition Protocol) |
| EX-EMERGENCY-BOOST-01 | Emergency boosts related sources and reduces non-critical polling. | `notams.md` (Emergency Acquisition Protocol) |
| EX-FORMAT-ICAO-01 | ICAO standard format detection. | `notams.md` (Format Detection stage) |
| EX-FORMAT-LEGACY-01 | Legacy format detection. | `notams.md` (Format Detection stage) |
| EX-FORMAT-EMERGENCY-01 | Emergency format detection. | `notams.md` (Format Detection stage) |
| EX-FORMAT-MULTILANG-01 | Multi-language content analysis. | `notams.md` (Format Detection stage) |
| EX-EXTRACT-HEADER-01 | Header information parsing. | `notams.md` (Field Extraction stage) |
| EX-EXTRACT-LOC-01 | Location coordinate extraction and altitude limits. | `notams.md` (Field Extraction stage) |
| EX-EXTRACT-DETAILS-01 | Time restrictions, affected facilities, and contact parsing. | `notams.md` (Field Extraction stage) |
| EX-VALIDATE-REQ-01 | Required field verification. | `notams.md` (Structure Validation stage) |
| EX-VALIDATE-TYPE-01 | Data type consistency check. | `notams.md` (Structure Validation stage) |
| EX-VALIDATE-COORD-01 | Coordinate format validation. | `notams.md` (Structure Validation stage) |
| EX-VALIDATE-TIME-01 | Timestamp range verification. | `notams.md` (Structure Validation stage) |
| EX-VALIDATE-AUTH-01 | Authority credential validation. | `notams.md` (Structure Validation stage) |
| EX-ANALYZE-KEYWORD-01 | Keyword classification. | `notams.md` (Content Analysis stage) |
| EX-ANALYZE-SEVERITY-01 | Severity assessment. | `notams.md` (Content Analysis stage) |
| EX-ANALYZE-IMPACT-01 | Impact area calculation. | `notams.md` (Content Analysis stage) |
| EX-ANALYZE-OPS-01 | Affected operations identification. | `notams.md` (Content Analysis stage) |
| EX-ANALYZE-REQ-01 | Special requirements extraction. | `notams.md` (Content Analysis stage) |
| EX-ENRICH-GEO-01 | Geographic coordinate assignment. | `notams.md` (Enhancement & Enrichment stage) |
| EX-ENRICH-STYLE-01 | Visual style determination. | `notams.md` (Enhancement & Enrichment stage) |
| EX-ENRICH-PRIORITY-01 | Priority and alert threshold assignment. | `notams.md` (Enhancement & Enrichment stage) |
| EX-ENRICH-XREF-01 | Cross-reference enhancement. | `notams.md` (Enhancement & Enrichment stage) |

| Spec Section | Example IDs | Legacy Observation Source |
| --- | --- | --- |
| 03_rules.md R1 (Restriction derivation) | EX-RESTRICTION-01, EX-RESTRICTION-02, EX-RESTRICTION-03 | `parser/uasParser.js` (restriction getter logic) |
| 03_rules.md R2 (Restriction level mapping) | EX-LEVEL-01, EX-LEVEL-02, EX-LEVEL-03 | `parser/uasParser.js` (restrictionLevels mapping) |
| 03_rules.md R3 (Localized messages) | EX-MESSAGE-01, EX-MESSAGE-02, EX-MESSAGE-03 | `parser/uasParser.js` (getLocalisedMessage) |
| 03_rules.md R4 (Geometry containment) | EX-GEO-01, EX-GEO-02, EX-GEO-03, EX-GEO-04, EX-GEO-05 | `parser/uasParser.js` (isPointInPolygon/isPointInFeature) |
| 03_rules.md R5 (Violation check) | EX-VIOLATION-01, EX-VIOLATION-02, EX-VIOLATION-03 | `parser/uasParser.js` (checkViolation) |
| 03_rules.md R6 (Feature filtering) | EX-FILTER-01, EX-FILTER-02 | `parser/uasParser.js` (prepareAirZones + excludedIdentifiers) |
| 03_rules.md R7 (Styling) | EX-STYLE-01, EX-STYLE-02, EX-STYLE-03 | `parser/uasParser.js` (getAirZoneStyle) |
| 03_rules.md R8 (Transformation) | EX-TRANSFORM-01, EX-TRANSFORM-02, EX-TRANSFORM-03, EX-TRANSFORM-04 | `parser/uasParser.js` (transformFeature) |
| 03_rules.md R9 (Altitude parsing) | EX-PARSEALT-01, EX-PARSEALT-02, EX-PARSEALT-03 | `parser/uasParser.js` (parseAlt in transformFeature) |
| 03_rules.md R10 (Acquisition scheduling) | EX-ACQ-SCHED-01, EX-ACQ-SCHED-02, EX-ACQ-SCHED-03, EX-ACQ-SCHED-04, EX-ACQ-SCHED-05, EX-ACQ-SCHED-06 | `notams.md` (Acquisition Schedule table) |
| 03_rules.md R11 (Acquisition workflow) | EX-ACQ-WF-01 | `notams.md` (Acquisition Workflow) |
| 03_rules.md R12 (Parsing pipeline) | EX-PARSE-PIPE-01 | `notams.md` (Parsing & Validation Pipeline) |
| 03_rules.md R13 (Emergency protocol) | EX-EMERGENCY-01 | `notams.md` (Emergency Response) |
| 03_rules.md R14 (Credential handling) | EX-CRED-FAILOVER-01, EX-CRED-ROTATE-01 | `notams.md` (Authentication and Credential Management Quirk) |
| 03_rules.md R15 (Format evolution) | EX-FORMAT-CHANGE-01, EX-FORMAT-CHANGE-02 | `notams.md` (Data Format Evolution Challenge) |
| 03_rules.md R16 (Retry backoff) | EX-RETRY-CRITICAL-01, EX-RETRY-NONCRIT-01, EX-RETRY-EXP-01 | `notams.md` (Network Reliability and Retry Logic Sophistication) |
| 03_rules.md R17 (Emergency multi-source) | EX-EMERGENCY-MULTI-01, EX-EMERGENCY-BOOST-01 | `notams.md` (Emergency Acquisition Protocol) |
| 03_rules.md R18 (Format detection) | EX-FORMAT-ICAO-01, EX-FORMAT-LEGACY-01, EX-FORMAT-EMERGENCY-01, EX-FORMAT-MULTILANG-01 | `notams.md` (Format Detection stage) |
| 03_rules.md R19 (Field extraction) | EX-EXTRACT-HEADER-01, EX-EXTRACT-LOC-01, EX-EXTRACT-DETAILS-01 | `notams.md` (Field Extraction stage) |
| 03_rules.md R20 (Structure validation) | EX-VALIDATE-REQ-01, EX-VALIDATE-TYPE-01, EX-VALIDATE-COORD-01, EX-VALIDATE-TIME-01, EX-VALIDATE-AUTH-01 | `notams.md` (Structure Validation stage) |
| 03_rules.md R21 (Content analysis) | EX-ANALYZE-KEYWORD-01, EX-ANALYZE-SEVERITY-01, EX-ANALYZE-IMPACT-01, EX-ANALYZE-OPS-01, EX-ANALYZE-REQ-01 | `notams.md` (Content Analysis stage) |
| 03_rules.md R22 (Enhancement & enrichment) | EX-ENRICH-GEO-01, EX-ENRICH-STYLE-01, EX-ENRICH-PRIORITY-01, EX-ENRICH-XREF-01 | `notams.md` (Enhancement & Enrichment stage) |
| 00_scope.md (Assumptions) | EX-VIOLATION-02 | `parser/uasParser.js` (AGL treated as 0 in violation check) |
| 02_data_model.md (Normalization rules) | EX-TRANSFORM-01, EX-TRANSFORM-02 | `parser/uasParser.js` (parseAlt and transform defaults) |
| 00_scope.md (Terminology) | N/A | `parser/logic.md` (Phase 1 summary and terminology) |
