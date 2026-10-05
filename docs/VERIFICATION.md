# Verification performed

Verified during creation on October 4, 2026:

- Java 17 / Maven build and packaging passed.
- 8 Spring Boot integration tests passed with the real SQL schema, migration, service, and controller.
- 3 React tests passed after dependency patches.
- Frontend production build passed.
- 4 Python importer tests passed.
- Browser check: seed records loaded, a fictional expense was created through the form, and FOOD filtering changed the list and matching summary to CAD 57.50 for two records.
- Live local import: both sample CSV records were submitted successfully.
- npm dependency audit reported zero vulnerabilities after updating Vite/Vitest and the remaining compatible patch. This is not a full security audit.

![Dashboard after adding fictional records and importing the sample CSV](dashboard.jpg)

Not verified: authentication, public deployment, performance at scale, real financial data, or PostgreSQL compatibility. None are implemented or claimed. The initial GitHub Actions run also passed: https://github.com/Sevyn1/transaction-lab/actions/runs/37260738786.


## Loading recovery — 5 October 2026

When a loading problem was reported, the local backend summary and Vite-proxied transaction list both returned HTTP 200 with valid data. The frontend had no request deadline, leaving a permanently pending fetch on Loading indefinitely. Browser permission was declined, so the specific reported browser stall was not directly reproduced.

Added a 10-second deadline covering both network and JSON parsing, cancellation of superseded/unmounted loads, response-shape checks, a visible Retry action, and a safe message for ambiguous timed-out writes. Twelve frontend tests now pass, including a permanently pending load leaving Loading, successful Retry recovery, stale-request cancellation and malformed-response handling. The production UI build passes. Direct live-browser verification remains pending permission.

### Local timeout recovery — 5 October 2026

The user reported repeated request timeouts. Temporary development-server logging
confirmed the page's GET requests reached Vite and were forwarded, but received no
upstream response before the page canceled them. Direct API and proxied command-line
checks returned HTTP 200 in about 0.1 seconds. After restarting the long-running
backend and setting the development proxy's `changeOrigin: true`, both subsequent
page-originated requests completed with HTTP 200 in approximately 145 ms. These two
interventions were applied together, so their individual effects are not isolated.
The proxy also has an eight-second upstream timeout. Temporary diagnostic logging
was removed; no request cookies or their values were recorded. Visual confirmation
of the displayed dashboard remains pending because browser automation is blocked.

### Refresh feedback — 5 October 2026

GET requests now use `cache: "no-store"`. The toolbar disables repeated clicks
while a load is in flight, shows “Refreshing…”, and displays a completion time only
after both datasets load successfully. A regression test clicks Refresh, verifies
new requests for both datasets, holds them pending to check feedback, and confirms
changed records and totals after completion. All 13 interface tests and the UI build
pass. The user's exact Refresh symptom and live visual confirmation remain pending;
this change does not establish browser caching as the root cause.

### Expense deletion — 5 October 2026

Each table row offers Delete with an inline confirmation and Cancel action.
Confirmed deletion uses a parameterized SQL DELETE by ID; successful responses are
204 and missing rows return 404. The request helper handles empty 204 responses.
After success, the UI reloads the first page and totals, preserving the category
filter. On failure it retains the row and displays the error; timeout guidance asks
for a refresh before retrying. Tests cover cancellation, successful removal and
summary refresh, failed deletion, missing/invalid IDs, and preservation of other
rows. All 10 backend integration tests and 15 interface tests pass, along with the
backend package and frontend build. Tests use an isolated in-memory database or
mocked HTTP; browser visual verification remains unavailable.
