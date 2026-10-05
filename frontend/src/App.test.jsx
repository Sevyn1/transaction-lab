import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import App from "./App.jsx";
const page = {
  items: [
    {
      id: 1,
      bookedOn: "2020-01-01",
      merchant: "Demo Cafe",
      category: "FOOD",
      amount: 12.5,
    },
  ],
  total: 1,
};
const summary = { total: 12.5, count: 1 };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("dashboard", () => {
  it("shows API data and disables empty pagination", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => ({
        ok: true,
        json: async () => (url.includes("summary") ? summary : page),
      })),
    );
    render(<App />);
    expect(await screen.findByText("Demo Cafe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByText("Total expenses")).toBeInTheDocument();
  });
  it("surfaces an API failure instead of demo success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "Service unavailable" }),
      })),
    );
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable",
    );
  });
  it("resets to page zero when category changes", async () => {
    const fetch = vi.fn(async (url) => ({
      ok: true,
      json: async () =>
        url.includes("summary") ? summary : { ...page, total: 11 },
    }));
    vi.stubGlobal("fetch", fetch);
    render(<App />);
    await screen.findByText("Demo Cafe");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/transactions?page=1&size=5",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
    fireEvent.change(
      screen.getByLabelText("Category", { selector: ".toolbar select" }),
      { target: { value: "FOOD" } },
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/transactions?page=0&size=5&category=FOOD",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
  });
});

it("recovers from an initial load failure when Retry is selected", async () => {
  let recovering=false;
  vi.stubGlobal("fetch", vi.fn(async (url)=>recovering ? ({ok:true,json:async()=>url.includes("summary") ? summary : page}) : ({ok:false,json:async()=>({error:"Service unavailable"})})));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  recovering=true;
  fireEvent.click(screen.getByRole("button",{name:"Retry"}));
  expect(await screen.findByText("Demo Cafe")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("reports malformed API data instead of crashing the dashboard", async () => {
  vi.stubGlobal("fetch",vi.fn(async()=>({ok:true,json:async()=>({unexpected:true})})));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("unexpected transaction data");
});

it("leaves loading and offers Retry when requests never resolve", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn(()=>new Promise(()=>{})));
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading transactions");
  await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});
  expect(screen.queryByText("Loading transactions…")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("request timed out");
  expect(screen.getByRole("button",{name:"Retry"})).toBeInTheDocument();
});

it("refreshes both datasets with fresh responses and shows completion", async () => {
  let release;
  let refreshed = false;
  const pause = new Promise(resolve => { release = resolve; });
  const fetch = vi.fn(async url => {
    if (refreshed) await pause;
    return { ok: true, json: async () => url.includes("summary")
      ? (refreshed ? { total: 42, count: 2 } : summary)
      : (refreshed ? { items: [{ ...page.items[0], merchant: "New Cafe", amount: 42 }], total: 2 } : page) };
  });
  vi.stubGlobal("fetch", fetch);
  render(<App />);
  await screen.findByText("Demo Cafe");
  refreshed = true;
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  expect(screen.getByRole("button", { name: "Refreshing…" })).toBeDisabled();
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
  for (const [, options] of fetch.mock.calls) expect(options.cache).toBe("no-store");
  await act(async () => release());
  expect(await screen.findByText("New Cafe")).toBeInTheDocument();
  expect(screen.getByText("$42.00", {selector: "strong"})).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Updated at");
  expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
});
