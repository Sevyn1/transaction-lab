import { useEffect, useState } from "react";
import { request } from "./api.js";
const categories = ["FOOD", "TRANSPORT", "HOUSING", "SHOPPING", "OTHER"];
const money = (value) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    value,
  );
export default function App() {
  const [category, setCategory] = useState(""),
    [page, setPage] = useState(0),
    [data, setData] = useState(null),
    [summary, setSummary] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setLoading(true);
    setError("");
    const filter = category ? `&category=${category}` : "";
    Promise.all([
      request(`/api/transactions?page=${page}&size=5${filter}`, options),
      request(`/api/summary${category ? "?category=" + category : ""}`, options),
    ])
      .then(([d, s]) => {
        if (!d || !Array.isArray(d.items) || !s || typeof s.total !== "number" || typeof s.count !== "number") throw new Error("The service returned unexpected transaction data.");
        if (active) {
          setData(d);
          setSummary(s);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
        controller.abort();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [category, page, refresh]);
  async function add(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const f = new FormData(event.currentTarget),
      form = event.currentTarget;
    const payload = Object.fromEntries(f);
    payload.currency = "CAD";
    try {
      await request("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      form.reset();
      setNotice("Transaction added.");
      setPage(0);
      setRefresh((v) => v + 1);
    } catch (e) {
      setNotice(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <main>
      <header>
        <span className="eyebrow">JAVA · REACT · SQL</span>
        <h1>Transaction Lab</h1>
        <p>Explore fictional expenses through a tested Spring Boot API.</p>
        <small>Portfolio demo · CAD only · no real customer data</small>
      </header>
      <section className="toolbar">
        <label>
          Category{" "}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setRefresh((v) => v + 1)}>Refresh</button>
      </section>
      {loading ? (
        <p role="status">Loading transactions…</p>
      ) : error ? (
        <div role="alert" className="error">
          <p>{error}</p>
          <button onClick={() => setRefresh((v) => v + 1)}>Retry</button>
        </div>
      ) : (
        <>
          <section className="metrics">
            <article>
              <span>Total expenses</span>
              <strong>{money(summary.total)}</strong>
            </article>
            <article>
              <span>Transactions</span>
              <strong>{summary.count}</strong>
            </article>
            <article>
              <span>Currency</span>
              <strong>CAD</strong>
            </article>
          </section>
          <section className="panel">
            <h2>Transaction history</h2>
            {data.items.length === 0 ? (
              <p>No transactions match this filter.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Merchant</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((t) => (
                      <tr key={t.id}>
                        <td>{t.bookedOn}</td>
                        <td>{t.merchant}</td>
                        <td>
                          <span className="tag">{t.category}</span>
                        </td>
                        <td>{money(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pager">
              <button
                disabled={page === 0}
                onClick={() => setPage((v) => v - 1)}
              >
                Previous
              </button>
              <span>
                Page {page + 1} · {data.total} records
              </span>
              <button
                disabled={(page + 1) * 5 >= data.total}
                onClick={() => setPage((v) => v + 1)}
              >
                Next
              </button>
            </div>
          </section>
        </>
      )}
      <section className="panel">
        <h2>Add a fictional expense</h2>
        <form onSubmit={add}>
          <label>
            Reference
            <input
              name="externalId"
              required
              pattern="[A-Za-z0-9_-]{1,64}"
              maxLength="64"
              placeholder="DEMO-004"
            />
          </label>
          <label>
            Date
            <input
              name="bookedOn"
              type="date"
              required
              max={new Date().toLocaleDateString("en-CA")}
            />
          </label>
          <label>
            Merchant
            <input
              name="merchant"
              required
              maxLength="100"
              placeholder="Example Cafe"
            />
          </label>
          <label>
            Category
            <select name="category">
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Amount in CAD
            <input
              name="amount"
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              required
              placeholder="12.50"
            />
          </label>
          <button disabled={saving} type="submit">
            {saving ? "Saving…" : "Add expense"}
          </button>
        </form>
        {notice && <p role="status">{notice}</p>}
      </section>
      <footer>
        Amounts use decimal arithmetic in Java and SQL. This is an expense
        ledger, not a bank account or financial advice tool.
      </footer>
    </main>
  );
}
