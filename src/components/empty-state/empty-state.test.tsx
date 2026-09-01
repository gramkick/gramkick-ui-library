import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title / description / actions in a centered column with a default icon", () => {
    render(
      <EmptyState
        title="No orders yet"
        description="They'll show up here."
        actions={<button>Add one</button>}
      />,
    );
    const root = screen.getByText("No orders yet").closest('[data-slot="empty-state"]')!;
    expect(root).toHaveClass("flex-col", "items-center", "text-center");
    expect(within(root).getByText("They'll show up here.")).toBeInTheDocument();
    expect(within(root).getByRole("button", { name: "Add one" })).toBeInTheDocument();
    expect(root.querySelector("svg")).toBeInTheDocument();
  });

  it("error variant is an alert with the error icon tone", () => {
    render(<EmptyState variant="error" title="Failed" />);
    const root = screen.getByRole("alert");
    expect(root).toHaveAttribute("data-variant", "error");
    expect(root.querySelector('[aria-hidden="true"]')).toHaveClass("text-danger");
  });

  it("accepts a custom icon and hides it with icon={null}", () => {
    const { rerender } = render(<EmptyState title="x" icon={<span data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();

    rerender(<EmptyState title="x" icon={null} />);
    expect(
      screen.getByText("x").closest('[data-slot="empty-state"]')!.querySelector("svg"),
    ).toBeNull();
  });

  it("applies size classes to the root and the title", () => {
    const { rerender } = render(<EmptyState title="Title" size="lg" />);
    let root = screen.getByText("Title").closest('[data-slot="empty-state"]')!;
    expect(root).toHaveClass("py-16");
    expect(screen.getByText("Title")).toHaveClass("text-lg");

    rerender(<EmptyState title="Title" size="sm" />);
    root = screen.getByText("Title").closest('[data-slot="empty-state"]')!;
    expect(root).toHaveClass("py-8");
    expect(screen.getByText("Title")).toHaveClass("text-sm");
  });

  it("bordered adds the dashed card chrome", () => {
    render(<EmptyState title="x" bordered />);
    expect(screen.getByText("x").closest('[data-slot="empty-state"]')).toHaveClass(
      "border",
      "border-dashed",
    );
  });

  it("runs an action handler", async () => {
    const onRetry = vi.fn();
    render(
      <EmptyState variant="error" title="x" actions={<button onClick={onRetry}>Retry</button>} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("merges className and forwards the ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<EmptyState ref={ref} title="x" className="my-6" />);
    expect(ref.current).toBe(screen.getByText("x").closest('[data-slot="empty-state"]'));
    expect(ref.current).toHaveClass("my-6");
  });
});
