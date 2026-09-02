import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dropdown, type DropdownOption } from "./dropdown";

const OPTIONS: DropdownOption[] = [
  { value: "mum", label: "Mumbai", subtext: "Maharashtra", tertiary: "MH", state: "Maharashtra" },
  { value: "del", label: "New Delhi", subtext: "Delhi", tertiary: "DL", state: "Delhi" },
  { value: "blr", label: "Bengaluru", subtext: "Karnataka", tertiary: "KA", state: "Karnataka" },
  { value: "pnq", label: "Pune", disabled: true, state: "Maharashtra" },
];

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("combobox"));
  return screen.getByRole("listbox");
};

describe("Dropdown", () => {
  it("renders label, placeholder and wires hint via aria-describedby", () => {
    render(
      <Dropdown options={OPTIONS} label="City" placeholder="Pick one" hint="Where you sell" />,
    );
    const combobox = screen.getByRole("combobox", { name: "City" });
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    const describedBy = combobox.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)).toHaveTextContent("Where you sell");
  });

  it("shows an error and marks the field invalid", () => {
    render(<Dropdown options={OPTIONS} label="City" error="Required" />);
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders a leftIcon inside the trigger, before the value", () => {
    render(
      <Dropdown
        options={OPTIONS}
        label="City"
        defaultValue="mum"
        leftIcon={<svg data-testid="left-icon" />}
      />,
    );
    const combobox = screen.getByRole("combobox");
    const icon = within(combobox).getByTestId("left-icon");
    expect(icon).toBeInTheDocument();
    expect(icon.compareDocumentPosition(screen.getByText("Mumbai"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("opens on click and lists options with subtext and tertiary text", async () => {
    const user = userEvent.setup();
    render(<Dropdown options={OPTIONS} label="City" />);
    const list = await open(user);
    const options = within(list).getAllByRole("option");
    expect(options).toHaveLength(4);
    expect(within(options[0]!).getByText("Mumbai")).toBeInTheDocument();
    expect(within(options[0]!).getByText("Maharashtra")).toBeInTheDocument();
    expect(within(options[0]!).getByText("MH")).toBeInTheDocument();
    expect(options[3]!).toHaveAttribute("aria-disabled", "true");
  });

  it("single select: picks an option, closes, reflects the label, fires onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} label="City" onChange={onChange} />);
    await open(user);
    await user.click(screen.getByRole("option", { name: /Bengaluru/ }));
    expect(onChange).toHaveBeenCalledWith("blr");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(within(screen.getByRole("combobox")).getByText("Bengaluru")).toBeInTheDocument();
  });

  it("isCategoriesList: renders grouped headings, filters groups on search, selects across them", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dropdown
        label="Catalogue"
        isCategoriesList
        searchable
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
    const list = await open(user);
    expect(within(list).getByText("Food & oil")).toBeInTheDocument();
    expect(within(list).getByText("Rice & grain")).toBeInTheDocument();
    expect(within(list).getAllByRole("option")).toHaveLength(3);

    await user.type(screen.getByRole("textbox", { name: "Search options" }), "rice");
    expect(within(list).queryByText("Food & oil")).not.toBeInTheDocument();
    expect(within(list).getByText("Rice & grain")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Basmati rice" }));
    expect(onChange).toHaveBeenCalledWith("basmati");
  });

  it("multi select: stays open, toggles, shows chips, fires onChange with an array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} label="Cities" multiple onChange={onChange} />);
    const list = await open(user);
    await user.click(within(list).getByRole("option", { name: /Mumbai/ }));
    await user.click(within(list).getByRole("option", { name: /New Delhi/ }));
    expect(onChange).toHaveBeenLastCalledWith(["mum", "del"]);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const combobox = screen.getByRole("combobox");
    expect(within(combobox).getByText("Mumbai")).toBeInTheDocument();
    expect(within(list).getByRole("option", { name: /Mumbai/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("removes a single chip and clears the whole selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dropdown
        options={OPTIONS}
        label="Cities"
        multiple
        defaultValue={["mum", "del"]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove Mumbai" }));
    expect(onChange).toHaveBeenLastCalledWith(["del"]);

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("does not open when disabled or readOnly", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Dropdown options={OPTIONS} label="City" disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    rerender(<Dropdown options={OPTIONS} label="City" readOnly defaultValue="del" />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  describe("searchable", () => {
    it("filters by the given searchKeys", async () => {
      const user = userEvent.setup();
      render(
        <Dropdown options={OPTIONS} label="City" searchable searchKeys={["label", "state"]} />,
      );
      await open(user);
      const search = screen.getByRole("textbox", { name: "Search options" });

      await user.type(search, "maha");
      let options = within(screen.getByRole("listbox")).getAllByRole("option");
      expect(options).toHaveLength(2); // Mumbai + Pune (state: Maharashtra)

      await user.clear(search);
      await user.type(search, "bengal");
      options = within(screen.getByRole("listbox")).getAllByRole("option");
      expect(options.map((o) => o.textContent)).toEqual([expect.stringContaining("Bengaluru")]);
    });

    it("shows the empty message when nothing matches", async () => {
      const user = userEvent.setup();
      render(<Dropdown options={OPTIONS} label="City" searchable emptyMessage="Nothing here" />);
      await open(user);
      await user.type(screen.getByRole("textbox", { name: "Search options" }), "zzzzz");
      expect(screen.getByText("Nothing here")).toBeInTheDocument();
      expect(within(screen.getByRole("listbox")).queryAllByRole("option")).toHaveLength(0);
    });
  });

  describe("keyboard", () => {
    it("opens with ArrowDown, moves the active option, selects with Enter, closes with Escape", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Dropdown options={OPTIONS} label="City" onChange={onChange} />);
      const combobox = screen.getByRole("combobox");
      combobox.focus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(combobox).toHaveAttribute("aria-activedescendant");

      await user.keyboard("{ArrowDown}{Enter}");
      expect(onChange).toHaveBeenCalledWith("del");

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("centres the value in the field for both single and multi", () => {
    const { rerender } = render(<Dropdown options={OPTIONS} label="City" />);
    expect(screen.getByRole("combobox")).toHaveClass("items-center");
    expect(screen.getByRole("combobox")).not.toHaveClass("items-start");
    rerender(<Dropdown options={OPTIONS} label="City" multiple />);
    expect(screen.getByRole("combobox")).toHaveClass("items-center");
  });

  it("keeps multi chips on one horizontally-scrollable row (no wrap)", () => {
    render(
      <Dropdown options={OPTIONS} label="Cities" multiple defaultValue={["mum", "del", "blr"]} />,
    );
    const combobox = screen.getByRole("combobox");
    // the chips live in a non-wrapping, x-scrollable content area
    const scroller = within(combobox).getByText("Mumbai").closest(".overflow-x-auto")!;
    expect(scroller).toHaveClass("flex-nowrap");
    expect(scroller).not.toHaveClass("flex-wrap");
  });

  describe("select all (multi)", () => {
    it("selects and clears every enabled option", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Dropdown options={OPTIONS} label="Cities" multiple selectAll onChange={onChange} />);
      await user.click(screen.getByRole("combobox"));

      const all = screen.getByRole("option", { name: "Select all" });
      await user.click(all);
      expect(onChange).toHaveBeenLastCalledWith(["mum", "del", "blr"]); // Pune is disabled
      expect(all).toHaveAttribute("aria-selected", "true");

      await user.click(all);
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it("acts only on the filtered subset when searching", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Dropdown
          options={OPTIONS}
          label="Cities"
          multiple
          selectAll
          searchable
          searchKeys={["label"]}
          onChange={onChange}
        />,
      );
      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByRole("textbox", { name: "Search options" }), "del");
      await user.click(screen.getByRole("option", { name: "Select all" }));
      expect(onChange).toHaveBeenLastCalledWith(["del"]);
    });
  });

  describe("auto placement", () => {
    afterEach(() => vi.restoreAllMocks());

    const pinToBottom = () => {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 300,
      });
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        top: 740,
        bottom: 770,
        left: 0,
        right: 300,
        width: 300,
        height: 30,
        x: 0,
        y: 740,
        toJSON: () => ({}),
      } as DOMRect);
      window.innerHeight = 800;
    };

    it("flips upward when there is no room below", async () => {
      const user = userEvent.setup();
      pinToBottom();
      render(<Dropdown options={OPTIONS} label="City" />);
      await user.click(screen.getByRole("combobox"));
      expect(screen.getByRole("listbox").parentElement!.className).toContain("bottom-full");
    });

    it("puts the search box below the list when flipped upward", async () => {
      const user = userEvent.setup();
      pinToBottom();
      render(<Dropdown options={OPTIONS} label="City" searchable />);
      await user.click(screen.getByRole("combobox"));
      const list = screen.getByRole("listbox");
      const search = screen.getByRole("textbox", { name: "Search options" });
      expect(list.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});

describe("Dropdown (controlled)", () => {
  it("respects a controlled value / onChange", async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<string[] | string | null>([]);
      return (
        <Dropdown options={OPTIONS} label="Cities" multiple value={value} onChange={setValue} />
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /Bengaluru/ }));
    expect(within(screen.getByRole("combobox")).getByText("Bengaluru")).toBeInTheDocument();
  });
});
