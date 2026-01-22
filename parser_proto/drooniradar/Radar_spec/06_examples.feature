Feature: UAS air zone parsing and evaluation

  # Example IDs map to Phase 1 observations in Radar_spec/07_traceability.md.

  # Restriction derivation
  Scenario: EX-RESTRICTION-01 Sensitive reason forces prohibited
    Given a feature with properties.reason "Sensitive"
    When I evaluate the AirZone restriction
    Then the restriction is "PROHIBITED"

  Scenario: EX-RESTRICTION-02 Non-Other reason forces authorisation
    Given a feature with properties.reason "Military"
    When I evaluate the AirZone restriction
    Then the restriction is "REQ_AUTHORISATION"

  Scenario: EX-RESTRICTION-03 No reason uses restriction or default
    Given a feature with no properties.reason and no properties.restriction
    When I evaluate the AirZone restriction
    Then the restriction is "NO_RESTRICTION"

  # Restriction levels
  Scenario: EX-LEVEL-01 No restriction maps to level 0
    Given a feature with no properties.reason and no properties.restriction
    When I evaluate the AirZone restrictionLevel
    Then the restrictionLevel is 0

  Scenario: EX-LEVEL-02 Authorisation maps to level 1
    Given a feature with properties.reason "Operational"
    When I evaluate the AirZone restrictionLevel
    Then the restrictionLevel is 1

  Scenario: EX-LEVEL-03 Prohibited maps to level 2
    Given a feature with properties.reason "Sensitive"
    When I evaluate the AirZone restrictionLevel
    Then the restrictionLevel is 2

  # Localized messages
  Scenario: EX-MESSAGE-01 Missing language returns base message
    Given a feature with properties.message "Base message"
    When I request the localized message with no language
    Then the message is "Base message"

  Scenario: EX-MESSAGE-02 Matching localized message prefix wins
    Given a feature with localizedMessages containing language "et-EE" and message "Tere"
    When I request the localized message with language "et"
    Then the message is "Tere"

  Scenario: EX-MESSAGE-03 Non-matching localized message falls back
    Given a feature with properties.message "Fallback"
    And localizedMessages containing language "lt-LT" and message "Labas"
    When I request the localized message with language "et"
    Then the message is "Fallback"

  # Geometry containment
  Scenario: EX-GEO-01 Point inside polygon exterior
    Given a polygon with an exterior ring that contains the point
    And no holes contain the point
    When I check containment
    Then the point is inside the feature

  Scenario: EX-GEO-02 Point outside polygon exterior
    Given a polygon with an exterior ring that does not contain the point
    When I check containment
    Then the point is outside the feature

  Scenario: EX-GEO-03 Point inside polygon hole
    Given a polygon with an exterior ring that contains the point
    And a hole ring that also contains the point
    When I check containment
    Then the point is outside the feature

  Scenario: EX-GEO-04 Point inside a multipolygon member
    Given a multipolygon with one polygon containing the point
    And the point is not inside any hole
    When I check containment
    Then the point is inside the feature

  Scenario: EX-GEO-05 Point outside all multipolygon members
    Given a multipolygon where the point is not inside any polygon
    When I check containment
    Then the point is outside the feature

  # Violation checks
  Scenario: EX-VIOLATION-01 Outside geometry yields no violation
    Given a feature whose geometry does not contain the position
    When I check for a violation
    Then the result is null

  Scenario: EX-VIOLATION-02 Outside altitude range yields no violation
    Given a feature whose geometry contains the position
    And the position altitude is below the lower limit
    When I check for a violation
    Then the result is null

  Scenario: EX-VIOLATION-03 Inside geometry and altitude yields violation
    Given a feature whose geometry contains the position
    And the position altitude is within the lower and upper limits
    When I check for a violation
    Then the result includes zoneId, zoneName, restriction, and restrictionLevel

  # Filtering
  Scenario: EX-FILTER-01 Excluded identifiers are removed
    Given a feature with properties.identifier "EERZout"
    When I prepare air zones
    Then the feature is excluded

  Scenario: EX-FILTER-02 Other identifiers remain
    Given a feature with properties.identifier "EETN1234"
    When I prepare air zones
    Then the feature is included

  # Styling
  Scenario: EX-STYLE-01 Prohibited zones are red
    Given a feature that yields restriction "PROHIBITED"
    When I compute its style
    Then the style color is "#d44"

  Scenario: EX-STYLE-02 Authorisation zones are blue
    Given a feature that yields restriction "REQ_AUTHORISATION"
    When I compute its style
    Then the style color is "#88d"

  Scenario: EX-STYLE-03 Default zones use base style color
    Given a feature that yields restriction "NO_RESTRICTION"
    When I compute its style
    Then the style color is "#0004"

  # Transformation
  Scenario: EX-TRANSFORM-01 EAIP source detection
    Given a feature with identifier "EETN1234"
    When I transform the feature
    Then the properties.source is "EAIP"

  Scenario: EX-TRANSFORM-02 UAS_ZONE source detection
    Given a feature with identifier "ZONE-1"
    When I transform the feature
    Then the properties.source is "UAS_ZONE"

  Scenario: EX-TRANSFORM-03 Prohibited priority
    Given a feature that yields restriction "PROHIBITED"
    When I transform the feature
    Then the properties.priority is "HIGH"

  Scenario: EX-TRANSFORM-04 Default priority
    Given a feature that yields restriction "NO_RESTRICTION"
    When I transform the feature
    Then the properties.priority is "LOW"

  # Altitude parsing for transformation
  Scenario: EX-PARSEALT-01 Null or AGL/SFC yields SFC reference with zero value
    Given a feature with lower limit value "AGL"
    When I transform the feature
    Then the lowerLimit is { value: 0, unit: "FT", referenceDatum: "SFC" }

  Scenario: EX-PARSEALT-02 Numeric altitude yields AMSL reference
    Given a feature with upper limit value "1500"
    When I transform the feature
    Then the upperLimit is { value: 1500, unit: "FT", referenceDatum: "AMSL" }

  Scenario: EX-PARSEALT-03 Non-numeric altitude yields default reference
    Given a feature with upper limit value "UNKNOWN" and default reference "AMSL"
    When I transform the feature
    Then the upperLimit is { value: 0, unit: "FT", referenceDatum: "AMSL" }

  # Acquisition scheduling
  Scenario: EX-ACQ-SCHED-01 ICAO Global schedule
    Given the source type is ICAO_GLOBAL
    When I schedule acquisition
    Then the frequency is "Every 5 min" and retry logic is "Exponential"

  Scenario: EX-ACQ-SCHED-02 National authority schedule
    Given the source type is NATIONAL_AUTHORITY
    When I schedule acquisition
    Then the frequency is "Every 2 min" and retry logic is "Immediate"

  Scenario: EX-ACQ-SCHED-03 Military exercises schedule
    Given the source type is MILITARY_EXERCISES
    When I schedule acquisition
    Then the frequency is "Every 1 min" and retry logic is "Immediate"

  Scenario: EX-ACQ-SCHED-04 Emergency notices schedule
    Given the source type is EMERGENCY_NOTICES
    When I schedule acquisition
    Then the frequency is "Real-time" and retry logic is "Immediate"

  Scenario: EX-ACQ-SCHED-05 Facility changes schedule
    Given the source type is FACILITY_CHANGES
    When I schedule acquisition
    Then the frequency is "Every 10 min" and retry logic is "Linear"

  Scenario: EX-ACQ-SCHED-06 Weather hazards schedule
    Given the source type is WEATHER_HAZARDS
    When I schedule acquisition
    Then the frequency is "Every 3 min" and retry logic is "Exponential"

  # Acquisition workflow
  Scenario: EX-ACQ-WF-01 Acquisition workflow ordering
    Given a registered source is enabled
    When acquisition begins
    Then the workflow is Source Discovery, Request Scheduling, Data Retrieval, Quality Assurance

  # Parsing pipeline
  Scenario: EX-PARSE-PIPE-01 Parsing pipeline stages
    Given a raw NOTAM payload is received
    When parsing starts
    Then the stages are Format Detection, Field Extraction, Structure Validation, Content Analysis, Enhancement & Enrichment

  # Emergency protocol
  Scenario: EX-EMERGENCY-01 Emergency acquisition protocol
    Given an emergency is declared
    When the emergency protocol activates
    Then the actions are Immediate Acquisition, Priority Processing, Real-time Distribution, Client Notification

  # Credential handling
  Scenario: EX-CRED-FAILOVER-01 Primary auth failure triggers backup
    Given a source with a primary credential that fails
    When acquisition retries authentication
    Then the system uses the backup authentication method

  Scenario: EX-CRED-ROTATE-01 Credential rotation before expiry
    Given a source with credentials near expiration
    When acquisition schedules the next request
    Then the credentials are rotated or refreshed before expiry

  # Format evolution
  Scenario: EX-FORMAT-CHANGE-01 New field classification
    Given a payload with an unexpected field
    When format detection analyzes the payload
    Then the field is classified as new information or a restructure of existing data

  Scenario: EX-FORMAT-CHANGE-02 Format change adaptation
    Given a payload format change is detected
    When parsing continues
    Then the parser adapts without halting acquisition

  # Retry backoff
  Scenario: EX-RETRY-CRITICAL-01 Critical source failure
    Given a failure on a critical source
    When retry policy is applied
    Then retry frequency increases

  Scenario: EX-RETRY-NONCRIT-01 Non-critical maintenance
    Given routine maintenance on a non-critical source
    When retry policy is applied
    Then retry frequency decreases to avoid overload

  Scenario: EX-RETRY-EXP-01 Exponential backoff
    Given a source configured for exponential backoff
    When retries occur after failures
    Then the delay between retries grows exponentially

  # Emergency multi-source
  Scenario: EX-EMERGENCY-MULTI-01 Parallel emergency acquisition
    Given emergency keywords are detected
    When emergency acquisition starts
    Then email, API, broadcast, and social feeds are polled in parallel and results are deduplicated

  Scenario: EX-EMERGENCY-BOOST-01 Runway closure boost
    Given a runway closure emergency notice
    When emergency acquisition adjusts priorities
    Then polling increases for airport sources and decreases for non-critical sources

  # Format detection
  Scenario: EX-FORMAT-ICAO-01 ICAO format detection
    Given a payload in ICAO standard format
    When format detection runs
    Then the payload is tagged as ICAO_STANDARD

  Scenario: EX-FORMAT-LEGACY-01 Legacy format detection
    Given a payload in a legacy format
    When format detection runs
    Then the payload is tagged as LEGACY

  Scenario: EX-FORMAT-EMERGENCY-01 Emergency format detection
    Given a payload in an emergency format
    When format detection runs
    Then the payload is tagged as EMERGENCY

  Scenario: EX-FORMAT-MULTILANG-01 Multi-language detection
    Given a payload containing multi-language content
    When format detection runs
    Then language metadata is recorded

  # Field extraction
  Scenario: EX-EXTRACT-HEADER-01 Header extraction
    Given a parsed payload
    When field extraction runs
    Then header fields are extracted (number, type, location indicator, issue time, effective period, authority)

  Scenario: EX-EXTRACT-LOC-01 Location and altitude extraction
    Given a parsed payload
    When field extraction runs
    Then location coordinates and altitude limits are extracted

  Scenario: EX-EXTRACT-DETAILS-01 Details extraction
    Given a parsed payload
    When field extraction runs
    Then time restrictions, affected facilities, and contact information are extracted

  # Structure validation
  Scenario: EX-VALIDATE-REQ-01 Required field validation
    Given a record missing required fields
    When structure validation runs
    Then validation fails with a missing-field error

  Scenario: EX-VALIDATE-TYPE-01 Type validation
    Given a record with inconsistent data types
    When structure validation runs
    Then validation fails with a type error

  Scenario: EX-VALIDATE-COORD-01 Coordinate validation
    Given a record with malformed coordinates
    When structure validation runs
    Then validation fails with a coordinate error

  Scenario: EX-VALIDATE-TIME-01 Timestamp validation
    Given a record with timestamps out of range
    When structure validation runs
    Then validation fails with a time-range error

  Scenario: EX-VALIDATE-AUTH-01 Authority validation
    Given a record with invalid authority credentials
    When structure validation runs
    Then validation fails with a credential error

  # Content analysis
  Scenario: EX-ANALYZE-KEYWORD-01 Keyword classification
    Given a record with classified keywords
    When content analysis runs
    Then the record is categorized by keywords

  Scenario: EX-ANALYZE-SEVERITY-01 Severity assessment
    Given a record meeting severity criteria
    When content analysis runs
    Then a severity level is assigned

  Scenario: EX-ANALYZE-IMPACT-01 Impact area calculation
    Given a record with geometry and scope
    When content analysis runs
    Then impact area is calculated

  Scenario: EX-ANALYZE-OPS-01 Affected operations identification
    Given a record referencing operations
    When content analysis runs
    Then affected operations are identified

  Scenario: EX-ANALYZE-REQ-01 Special requirements extraction
    Given a record describing special requirements
    When content analysis runs
    Then special requirements are extracted

  # Enhancement & enrichment
  Scenario: EX-ENRICH-GEO-01 Geographic assignment
    Given a validated record
    When enrichment runs
    Then geographic coordinates are assigned

  Scenario: EX-ENRICH-STYLE-01 Visual style determination
    Given a validated record
    When enrichment runs
    Then visual style is determined for map display

  Scenario: EX-ENRICH-PRIORITY-01 Priority and alert threshold assignment
    Given a validated record
    When enrichment runs
    Then priority level and alert thresholds are assigned

  Scenario: EX-ENRICH-XREF-01 Cross-reference enhancement
    Given a validated record
    When enrichment runs
    Then related records are cross-referenced
