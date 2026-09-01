import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("shows on hover and hides on unhover, wiring aria-describedby", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Save" openDelay={0} closeDelay={0}>
        <button>Icon</button>
      </Tooltip>,
    );
    const btn = screen.getByRole("button", { name: "Icon" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.hover(btn);
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Save");
    expect(btn).toHaveAttribute("aria-describedby", tip.getAttribute("id"));

    await user.unhover(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on focus and hides on blur", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hi" trigger="focus">
        <button>Field</button>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    await user.tab();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toggles on click, closes on outside click and Escape", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Tooltip content="Menu" trigger="click">
          <button>Open</button>
        </Tooltip>
        <button>Outside</button>
      </div>,
    );
    const btn = screen.getByRole("button", { name: "Open" });

    await user.click(btn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "true");

    await user.click(btn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(btn);
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(btn);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders description and actions as nodes", async () => {
    const user = userEvent.setup();
    const onAct = vi.fn();
    render(
      <Tooltip
        trigger="click"
        content="Unsaved"
        description="Publish to go live."
        actions={<button onClick={onAct}>Publish</button>}
      >
        <button>Status</button>
      </Tooltip>,
    );
    await user.click(screen.getByRole("button", { name: "Status" }));
    const panel = screen.getByRole("dialog");
    expect(within(panel).getByText("Publish to go live.")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Publish" }));
    expect(onAct).toHaveBeenCalled();
  });

  it("applies variant / size / side classes and toggles the arrow", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Tooltip content="x" openDelay={0} variant="light" size="lg" side="bottom">
        <button>A</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button", { name: "A" }));
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveClass("bg-canvas", "px-3.5", "top-full");
    expect(tip).toHaveAttribute("data-side", "bottom");
    expect(tip.querySelector('[data-slot="tooltip-arrow"]')).toBeInTheDocument();

    rerender(
      <Tooltip content="x" openDelay={0} arrow={false} side="right">
        <button>A</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button", { name: "A" }));
    const tip2 = await screen.findByRole("tooltip");
    expect(tip2).toHaveClass("left-full");
    expect(tip2.querySelector('[data-slot="tooltip-arrow"]')).not.toBeInTheDocument();
  });

  it("is controllable via the open prop", async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen((o) => !o)}>Toggle</button>
          <Tooltip content="Controlled" open={open} onOpenChange={setOpen}>
            <button>Target</button>
          </Tooltip>
        </>
      );
    }
    render(<Host />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Controlled");
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="nope" disabled openDelay={0}>
        <button>D</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button", { name: "D" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("keeps the trigger's own onClick working", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Tooltip content="tip" trigger="click">
        <button onClick={onClick}>Go</button>
      </Tooltip>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
