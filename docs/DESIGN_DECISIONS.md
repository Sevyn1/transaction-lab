# Design decisions

## Exact amounts belong on the backend

Java uses BigDecimal and SQL uses DECIMAL(12,2). The request validator rejects amounts with excess precision before storing them. All records are CAD, so the summary never mixes currencies. The React formatter converts values for display; it does not calculate account balances.

## Database uniqueness handles duplicate references

A unique constraint on external_id enforces duplicate protection at the database boundary. Checking for an existing row before insertion would leave a race between the check and the insert. A duplicate returns HTTP 409 and leaves the record count unchanged.

## H2 keeps the demo reproducible

The embedded database removes a separate database-server setup step. Flyway creates the schema and seeds a small fictional dataset. This demonstrates SQL persistence and migration behavior; PostgreSQL compatibility would require separate integration tests.

## CSV imports report partial outcomes

Python validates each row, detects accepted duplicate IDs within the file, and submits valid rows one at a time. The report distinguishes validation failures from API failures and returns a nonzero exit status when either occurs. This implementation favors transparent partial results; atomic batches are a possible extension.

## Failures remain visible

The UI surfaces a failed API response instead of showing sample data as though the real request succeeded. Filters apply to both list and summary; changing the filter resets pagination. Deterministic tests cover the request flow, input boundaries, decimal total, duplicate handling, and UI failure state.
