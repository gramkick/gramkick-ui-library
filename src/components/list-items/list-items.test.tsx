import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListItems } from "./list-items";

const options = [
  { value: "a", label: "Apples", subtext: "Fuji", tertiary: "12" },
  { value: "b", label: "Bananas", subtext: "Cavendish", tertiary: "5" },
  { value: "c", label: "Cherries", disabled: true },
];

describe("ListItems", () => {
  it("renders the options as a listbox with label / subtext / tertiary", () => {
    render(<ListItems options={options} aria-label="Fruit" />);
    const list = screen.getByRole("listbox", { name: "Fruit" });
    expect(within(list).getAllByRole("option")).toHaveLength(3);
    expect(within(list).getByText("Fuji")).toBeInTheDocument();
    expect(within(list).getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Cherries/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("single-selects a row and reports the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ListItems options={options} aria-label="Fruit" onChange={onChange} />);
    await user.click(screen.getByRole("option", { name: /Apples/ }));
    expect(onChange).toHaveBeenLastCalledWith("a");
    expect(screen.getByRole("option", { name: /Apples/ })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("option", { name: /Bananas/ }));
    expect(onChange).toHaveBeenLastCalledWith("b");
    expect(screen.getByRole("option", { name: /Apples/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("does not select a disabled row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ListItems options={options} aria-label="Fruit" onChange={onChange} />);
    await user.click(screen.getByRole("option", { name: /Cherries/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("multi-selects with checkboxes and a select-all row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ListItems options={options} aria-label="Fruit" multiple selectAll onChange={onChange} />,
    );
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(4); // + select all

    await user.click(screen.getByRole("option", { name: /Apples/ }));
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
    await user.click(screen.getByRole("option", { name: /Bananas/ }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);

    // every enabled row is checked -> select-all clears them (disabled "c" is never touched)
    await user.click(screen.getByRole("option", { name: "Select all" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    await user.click(screen.getByRole("option", { name: "Select all" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("display-only mode fires onItemClick but keeps no selection", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    const onChange = vi.fn();
    render(
      <ListItems
        options={options}
        aria-label="Fruit"
        selectable={false}
        onItemClick={onItemClick}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("option", { name: /Apples/ }));
    expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ value: "a" }), 0);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: /Apples/ })).not.toHaveAttribute("aria-selected");
  });

  it("navigates with the keyboard and activates with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ListItems options={options} aria-label="Fruit" onChange={onChange} />);
    screen.getByRole("listbox").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("b");
  });

  it("applies size and variant classes", () => {
    const { rerender } = render(
      <ListItems options={options} aria-label="Fruit" size="lg" variant="filled" />,
    );
    expect(screen.getByRole("listbox").closest("div")).toHaveClass("bg-mint");
    expect(screen.getByRole("option", { name: /Apples/ })).toHaveClass("text-base");
    rerender(<ListItems options={options} aria-label="Fruit" size="sm" />);
    expect(screen.getByRole("option", { name: /Apples/ })).toHaveClass("text-sm");
  });

  it("supports a controlled multi value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [v, setV] = useState<string[]>(["a"]);
      return (
        <>
          <ListItems
            options={options}
            aria-label="Fruit"
            multiple
            value={v}
            onChange={(next) => setV(next as string[])}
          />
          <span data-testid="v">{v.join(",")}</span>
        </>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("option", { name: /Bananas/ }));
    expect(screen.getByTestId("v")).toHaveTextContent("a,b");
  });

  it("shows the empty message", () => {
    render(<ListItems options={[]} aria-label="Fruit" emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders an action menu with role=menu / menuitem and fires onItemClick", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(
      <ListItems
        role="menu"
        selectable={false}
        aria-label="Row actions"
        onItemClick={onItemClick}
        options={[
          { value: "edit", label: "Edit" },
          { value: "delete", label: "Delete", destructive: true, separated: true },
        ]}
      />,
    );
    const menu = screen.getByRole("menu", { name: "Row actions" });
    expect(menu).not.toHaveAttribute("aria-multiselectable");
    const rows = within(menu).getAllByRole("menuitem");
    expect(rows).toHaveLength(2);
    expect(rows[1]).not.toHaveAttribute("aria-selected");
    await user.click(rows[1]!);
    expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ value: "delete" }), 1);
  });

  it("renders category headings and still selects across groups when isCategoriesList", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ListItems
        aria-label="Catalogue"
        isCategoriesList
        onChange={onChange}
        options={{
          "Food & oil": [
            { value: "ghee", label: "Ghee" },
            { value: "oil", label: "Sunflower oil" },
          ],
          "Rice & grain": [{ value: "basmati", label: "Basmati rice" }],
        }}
      />,
    );
    const list = screen.getByRole("listbox", { name: "Catalogue" });
    // headings are presentational, not options
    expect(within(list).getByText("Food & oil")).toBeInTheDocument();
    expect(within(list).getByText("Rice & grain")).toBeInTheDocument();
    expect(within(list).getAllByRole("option")).toHaveLength(3);

    await user.click(screen.getByRole("option", { name: "Basmati rice" }));
    expect(onChange).toHaveBeenLastCalledWith("basmati");
  });
});
