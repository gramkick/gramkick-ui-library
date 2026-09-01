import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders a status element with the default text shape and pulse", () => {
    render(<Skeleton />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("rounded", "h-4", "motion-safe:animate-pulse");
    expect(el).toHaveAttribute("aria-label", "Loading");
    expect(el).toHaveAttribute("aria-busy", "true");
  });

  it("applies variant + size classes", () => {
    const { rerender } = render(<Skeleton variant="circle" size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("size-14", "rounded-full");
    rerender(<Skeleton variant="rounded" size="md" />);
    expect(screen.getByRole("status")).toHaveClass("rounded-gk-md", "h-24");
  });

  it("turns the pulse off with animation='none'", () => {
    render(<Skeleton animation="none" />);
    expect(screen.getByRole("status")).not.toHaveClass("motion-safe:animate-pulse");
  });

  it("adds a left-to-right sweep with animation='shimmer'", () => {
    render(<Skeleton animation="shimmer" />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("relative", "overflow-hidden");
    const sweep = el.querySelector('[data-slot="skeleton-sweep"]');
    expect(sweep).toBeInTheDocument();
    expect(sweep).toHaveClass("motion-safe:animate-skeleton-shimmer");
  });

  it("puts a sweep on every line of a shimmering multi-line block", () => {
    render(<Skeleton lines={3} animation="shimmer" />);
    expect(
      screen.getByRole("status").querySelectorAll('[data-slot="skeleton-sweep"]'),
    ).toHaveLength(3);
  });

  it("sets explicit width / height (numbers become px)", () => {
    render(<Skeleton width={200} height={40} />);
    const el = screen.getByRole("status");
    expect(el).toHaveStyle({ width: "200px", height: "40px" });
  });

  it("passes through a string length verbatim", () => {
    render(<Skeleton width="55%" />);
    expect(screen.getByRole("status")).toHaveStyle({ width: "55%" });
  });

  it("renders a multi-line block with a shorter last line", () => {
    render(<Skeleton lines={3} label="Loading profile" />);
    const group = screen.getByRole("status", { name: "Loading profile" });
    const lines = group.querySelectorAll('[data-slot="skeleton-line"]');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveClass("w-3/5");
  });

  it("merges className and forwards the ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} className="my-2" />);
    expect(ref.current).toBe(screen.getByRole("status"));
    expect(ref.current).toHaveClass("my-2");
  });
});
