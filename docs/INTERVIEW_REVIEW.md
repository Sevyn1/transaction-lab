# Review before using this project in an interview

This project was generated with Codex assistance. Work through these tasks to establish your own understanding and contribution. Do not describe an exercise as completed until you have done it.

1. **Trace one expense.** Follow the React form through `request`, the POST controller, input validation, service, JDBC insert, and response. Explain which checks run in the browser versus server and why the server must validate independently.
2. **Explain money.** Run the decimal-total test. Explain why Java uses `BigDecimal` and SQL uses `DECIMAL`, and why the app totals only CAD. Identify the UI's display conversion and its limits.
3. **Explain React.** Point out state, props passed to HTML elements, controlled category input, effect dependencies, stable list keys, and cleanup that ignores responses after an effect is replaced. Explain why a failed HTTP response is shown rather than silently replaced with fictional data.
4. **Inspect SQL.** Explain the unique reference, prepared query parameters, date/category indexes, and deterministic pagination order. Explain why database uniqueness is more reliable than checking in application code before insert.
5. **Inspect Python.** Run dry-run validation, add a malformed row, then try a duplicate. Explain that the importer is non-atomic and reports partial success. Compare Python validation with Java validation.
6. **Make a real change.** Add a merchant-search filter to the API and UI, with a test for special characters. Or add a loading/error test for failed expense creation. Record the requirement, the AI suggestion, what you changed, and the result.
7. **Describe boundaries.** Explain what would be needed before hosting this with real data: authentication, authorization, credential management, monitoring, and a suitable database. Do not claim those features exist today.

Suggested truthful description after reviewing the code: “I used Codex to help build a Java/Spring Boot and React portfolio demo. I reviewed the request flow, ran its tests, and implemented [your actual change]. The demo uses SQL migrations, validates expense records, and includes a Python CSV importer.”
