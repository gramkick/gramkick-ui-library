import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePagedList } from "./use-paged-list";

const pages: Record<number, string[]> = { 1: ["a", "b"], 2: ["c", "d"], 3: ["e"] };
const fetchPage = (page: number) => Promise.resolve({ items: pages[page] ?? [], total: 5 });

describe("usePagedList", () => {
  it("loads page 1, appends on loadMore, and knows when it's done", async () => {
    const { result } = renderHook(() => usePagedList({ fetchPage }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.items).toEqual(["a", "b"]));
    expect(result.current.hasMore).toBe(true);
    await act(() => result.current.loadMore());
    await act(() => result.current.loadMore());
    expect(result.current.items).toEqual(["a", "b", "c", "d", "e"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("stays idle while disabled", () => {
    let calls = 0;
    renderHook(() => usePagedList({ fetchPage: (p: number) => { calls += 1; return fetchPage(p); }, enabled: false }));
    expect(calls).toBe(0);
  });

  it("drops a late answer once a start-over has begun", async () => {
    let resolveSlow: (v: { items: string[]; total: number }) => void = () => {};
    let call = 0;
    const racy = (page: number) => {
      call += 1;
      if (call === 1) return new Promise<{ items: string[]; total: number }>((r) => { resolveSlow = r; });
      return fetchPage(page);
    };
    const { result } = renderHook(() => usePagedList({ fetchPage: racy }));
    await act(() => result.current.reload());
    await act(async () => resolveSlow({ items: ["stale"], total: 1 }));
    expect(result.current.items).toEqual(["a", "b"]);
  });

  it("reports a failed request", async () => {
    const { result } = renderHook(() => usePagedList({ fetchPage: () => Promise.reject(new Error("Nope")) }));
    await waitFor(() => expect(result.current.error).toBe("Nope"));
    expect(result.current.loading).toBe(false);
  });
});
