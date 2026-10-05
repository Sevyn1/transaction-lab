import { it, expect, vi, afterEach } from "vitest";
import { request } from "./api.js";
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it("ends a permanently pending request at its deadline",async()=>{
  vi.useFakeTimers();let signal;
  vi.stubGlobal("fetch",vi.fn((_,options)=>{signal=options.signal;return new Promise(()=>{});}));
  const pending=request("/api/summary",{timeoutMs:25});
  const rejected=expect(pending).rejects.toThrow("request timed out");
  await vi.advanceTimersByTimeAsync(25);await rejected;
  expect(signal.aborted).toBe(true);expect(vi.getTimerCount()).toBe(0);
});
it("times out even when response-body parsing never finishes",async()=>{
  vi.useFakeTimers();vi.stubGlobal("fetch",vi.fn(async()=>({ok:true,json:()=>new Promise(()=>{})})));
  const rejected=expect(request("/api/summary",{timeoutMs:25})).rejects.toThrow("request timed out");
  await vi.advanceTimersByTimeAsync(25);await rejected;
});
it("cancels network work when the view is replaced",async()=>{
  const external=new AbortController();let signal;
  vi.stubGlobal("fetch",vi.fn((_,options)=>{signal=options.signal;return new Promise((_,reject)=>signal.addEventListener("abort",()=>reject(new DOMException("Canceled","AbortError")),{once:true}));}));
  const pending=request("/api/summary",{signal:external.signal});
  const rejected=expect(pending).rejects.toHaveProperty("name","AbortError");
  external.abort();await rejected;expect(signal.aborted).toBe(true);
});
it("clears the deadline after a successful response",async()=>{
  vi.useFakeTimers();vi.stubGlobal("fetch",vi.fn(async()=>({ok:true,json:async()=>({total:12.5})})));
  expect(await request("/api/summary")).toEqual({total:12.5});expect(vi.getTimerCount()).toBe(0);
});
it("reports unreadable responses and connection failures clearly",async()=>{
  vi.stubGlobal("fetch",vi.fn(async()=>({ok:true,json:async()=>{throw new SyntaxError("not json");}})));
  await expect(request("/api/summary")).rejects.toThrow("unreadable response");
  vi.stubGlobal("fetch",vi.fn(async()=>{throw new TypeError("Failed to fetch");}));
  await expect(request("/api/summary")).rejects.toThrow("Cannot connect");
});

it("does not advise blindly repeating a timed-out write",async()=>{
  vi.useFakeTimers();vi.stubGlobal("fetch",vi.fn(()=>new Promise(()=>{})));
  const rejected=expect(request("/api/transactions",{method:"POST",timeoutMs:25})).rejects.toThrow("Refresh the transaction list before retrying");
  await vi.advanceTimersByTimeAsync(25);await rejected;
});
