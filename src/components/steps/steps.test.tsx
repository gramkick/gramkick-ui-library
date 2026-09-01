import { createRef, useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Steps } from "./steps";

const steps = [
  { label: "Cart", description: "3 items" },
  { label: "Address" },
  { label: "Payment" },
  { label: "Review" },
];

describe("Steps", () => {
  it("renders a labelled list with a step per item and derives statuses from current", () => {
    render(<Steps steps={steps} current={2} aria-label="Checkout" />);
    const list = screen.getByRole("list", { name: "Checkout" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveAttribute("data-status", "complete");
    expect(items[1]).toHaveAttribute("data-status", "complete");
    expect(items[2]).toHaveAttribute("data-status", "current");
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[3]).toHaveAttribute("data-status", "pending");
    expect(within(list).getByText("Cart")).toBeInTheDocument();
    expect(within(list).getByText("3 items")).toBeInTheDocument();
  });

  it("shows the number on pending / current and a check on complete", () => {
    render(<Steps steps={steps} current={1} />);
    const items = screen.getAllByRole("listitem");
    // step 0 is complete -> a check svg, no "1"
    expect(within(items[0]!).queryByText("1")).not.toBeInTheDocument();
    expect(items[0]!.querySelector("svg")).toBeInTheDocument();
    // step 1 is current -> shows "2"
    expect(within(items[1]!).getByText("2")).toBeInTheDocument();
  });

  it("honours an explicit error status", () => {
    render(
      <Steps
        steps={[{ label: "A" }, { label: "B", status: "error" }, { label: "C" }]}
        current={2}
      />,
    );
    const b = screen.getAllByRole("listitem")[1]!;
    expect(b).toHaveAttribute("data-status", "error");
    expect(b.querySelector('[data-slot="step-indicator"]')).toHaveClass("bg-danger");
  });

  it("makes completed / current steps clickable and reports the index", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    const onCurrentChange = vi.fn();
    render(
      <Steps
        steps={steps}
        current={2}
        clickable
        onStepClick={onStepClick}
        onCurrentChange={onCurrentChange}
      />,
    );
    // pending step has no button
    expect(screen.queryByRole("button", { name: "Review" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cart" }));
    expect(onStepClick).toHaveBeenCalledWith(0, expect.objectContaining({ label: "Cart" }));
    expect(onCurrentChange).toHaveBeenCalledWith(0);
  });

  it("supports an uncontrolled current via defaultCurrent + clicks", async () => {
    const user = userEvent.setup();
    function Host() {
      return <Steps steps={steps} defaultCurrent={3} clickable />;
    }
    render(<Host />);
    // steps 0-2 are complete -> clickable; click step 1
    await user.click(screen.getByRole("button", { name: "Address" }));
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("data-status", "current");
  });

  it("supports a controlled current", async () => {
    const user = userEvent.setup();
    function Host() {
      const [c, setC] = useState(2);
      return <Steps steps={steps} current={c} clickable onStepClick={setC} />;
    }
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Cart" }));
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("data-status", "current");
  });

  it("renders vertically and applies size / variant classes", () => {
    const { rerender } = render(
      <Steps steps={steps} current={1} orientation="vertical" size="lg" />,
    );
    expect(screen.getByRole("list")).toHaveClass("flex-col");
    let complete = screen
      .getAllByRole("listitem")[0]!
      .querySelector('[data-slot="step-indicator"]')!;
    expect(complete).toHaveClass("size-10", "bg-leaf");

    rerender(<Steps steps={steps} current={1} variant="outline" size="sm" />);
    complete = screen.getAllByRole("listitem")[0]!.querySelector('[data-slot="step-indicator"]')!;
    expect(complete).toHaveClass("size-7");
    expect(complete).not.toHaveClass("bg-leaf");
  });

  it("strength-track mode: renders a segmented progressbar from `percent`", () => {
    render(<Steps percent={70} aria-label="Password strength" />);
    const bar = screen.getByRole("progressbar", { name: "Password strength" });
    expect(bar).toHaveAttribute("aria-valuenow", "70");
    expect(bar).toHaveAttribute("data-strength", "strong");
    expect(bar.querySelectorAll('[data-slot="strength-segment"]')).toHaveLength(4);
    expect(bar.querySelectorAll('[data-slot="strength-segment"][data-filled]')).toHaveLength(3);
    expect(within(bar).getByText("Strong")).toHaveClass("text-leaf");
    // `steps` are ignored in this mode
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("strength-track mode: maps percent to weak / fair / strong and honours segments / showValue / label", () => {
    const { rerender } = render(<Steps percent={20} segments={5} />);
    let bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("data-strength", "weak");
    expect(bar.querySelectorAll('[data-slot="strength-segment"]')).toHaveLength(5);
    expect(within(bar).getByText("Weak")).toBeInTheDocument();

    rerender(<Steps percent={50} showValue />);
    bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("data-strength", "fair");
    expect(within(bar).getByText("50%")).toBeInTheDocument();

    rerender(<Steps percent={90} label="Great password" showValue />);
    expect(screen.getByText("Great password · 90%")).toBeInTheDocument();
  });

  it("uses a custom step icon and forwards the ref", () => {
    const ref = createRef<HTMLOListElement>();
    render(
      <Steps
        ref={ref}
        steps={[{ label: "A", icon: <span data-testid="star" /> }, { label: "B" }]}
        current={0}
      />,
    );
    expect(ref.current?.tagName).toBe("OL");
    expect(screen.getByTestId("star")).toBeInTheDocument();
  });
});
