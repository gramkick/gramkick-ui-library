import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Accordion } from "./accordion";

const ITEMS = [
  { value: "a", title: "First", content: "First body" },
  { value: "b", title: "Second", content: "Second body" },
  { value: "c", title: "Third", content: "Third body", disabled: true },
];

describe("Accordion", () => {
  it("renders a trigger per item wired to its panel", () => {
    render(<Accordion items={ITEMS} />);
    const first = screen.getByRole("button", { name: "First" });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(first).toHaveAttribute("aria-controls", screen.getByRole("region", { name: "First" }).id);
  });

  it("opens the item named by defaultValue", () => {
    render(<Accordion items={ITEMS} defaultValue="b" />);
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "false");
  });

  it("in single mode, opening one closes the others", async () => {
    render(<Accordion items={ITEMS} defaultValue="a" />);
    await userEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
  });

  it("collapsible single mode closes the open item on re-click", async () => {
    render(<Accordion items={ITEMS} defaultValue="a" />);
    await userEvent.click(screen.getByRole("button", { name: "First" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "false");
  });

  it("collapsible={false} keeps one item open", async () => {
    render(<Accordion items={ITEMS} defaultValue="a" collapsible={false} />);
    await userEvent.click(screen.getByRole("button", { name: "First" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
  });

  it("multiple mode keeps siblings open and reports every value", async () => {
    const onValueChange = vi.fn();
    render(<Accordion items={ITEMS} type="multiple" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "First" }));
    await userEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("does not toggle a disabled item", async () => {
    render(<Accordion items={ITEMS} />);
    const third = screen.getByRole("button", { name: "Third" });
    expect(third).toBeDisabled();
    await userEvent.click(third);
    expect(third).toHaveAttribute("aria-expanded", "false");
  });

  it("honours a controlled value", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Accordion items={ITEMS} value="a" onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getByRole("button", { name: "Second" }));
    // Controlled: state does not change until the parent updates `value`.
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenCalledWith(["b"]);
    rerender(<Accordion items={ITEMS} value="b" onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
  });

  it("applies variant + size classes on the root", () => {
    const { container, rerender } = render(<Accordion items={ITEMS} variant="contained" />);
    expect(container.firstChild).toHaveClass("border", "divide-y", "rounded-gk-md");
    rerender(<Accordion items={ITEMS} variant="ghost" />);
    expect(container.firstChild).toHaveClass("divide-y");
    expect(container.firstChild).not.toHaveClass("border");
  });
});
