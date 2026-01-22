# Drooniradar.ee vs P2_spec Comparison

## Access Attempt Summary
The comparison could not be completed because the environment was blocked from accessing the site.

- `https://drooniradar.ee/` returned **HTTP 403 Forbidden**.
- `http://drooniradar.ee/` returned **HTTP 403 Forbidden** with `Domain forbidden`.

These responses prevented retrieving the application HTML, JavaScript bundles, or any runtime behavior needed to compare against `P2_spec`.

## Recheck (2026-01-22)
Re-ran the fetch and received **HTTP 403 Forbidden** again, so no new data could be collected.

## Impact on Comparison
Because the site content could not be accessed, no reliable behavioral diff can be produced. This means:
- No UI or API behaviors from drooniradar.ee could be observed.
- No additional rules can be attributed to drooniradar.ee without inventing behavior (which is prohibited).

## Requested Next Step (If Access Is Granted)
If access is allowed (e.g., whitelisting in the environment), re-run the comparison using:
- Page HTML/JS bundle inspection (download and parse the app bundle for logic).
- API/network inspection (identify endpoints, polling intervals, data schemas).
- UI-driven checks for drawing, sorting, filtering, and validation behavior.

Until access is restored, the only responsible conclusion is **“comparison blocked by access restrictions.”**
