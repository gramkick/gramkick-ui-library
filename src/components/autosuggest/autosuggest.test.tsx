import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Autosuggest, type AutosuggestOption } from "./autosuggest";

const CITIES: AutosuggestOption[] = [
  { value: "mum", label: "Mumbai", subtext: "Maharashtra", state: "Maharashtra" },
  { value: "del", label: "New Delhi", subtext: "Delhi", state: "Delhi" },
  { value: "blr", label: "Bengaluru", subtext: "Karnataka", state: "Karnataka" },
  { value: "pnq", label: "Pune", disabled: true, state: "Maharashtra" },
];

describe("Autosuggest", () => {
  it("wires label / hint / error like the other fields", () => {
    render(<Autosuggest options={CITIES} label="City" hint="City or state" error="Required" />);
    const input = screen.getByRole("combobox", { name: "City" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("City or state")).not.toBeInTheDocument(); // hidden while error is set
  });

  it("renders a leftIcon inside the field, before the input", () => {
    render(
      <Autosuggest
        options={CITIES}
        label="City"
        leftIcon={<svg data-testid="search-icon" />}
      />,
    );
    const icon = screen.getByTestId("search-icon");
    const input = screen.getByRole("combobox", { name: "City" });
    expect(icon).toBeInTheDocument();
    // icon comes before the input in DOM order
    expect(icon.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("filters local options as you type (debounce 0)", async () => {
    const user = userEvent.setup();
    render(
      <Autosuggest options={CITIES} label="City" debounce={0} searchKeys={["label", "state"]} />,
    );
    const input = screen.getByRole("combobox");
    await user.type(input, "maha");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      expect.stringContaining("Mumbai"),
      expect.stringContaining("Pune"),
    ]);
  });

  it("single select: fills the input, closes, fires onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Autosuggest options={CITIES} label="City" debounce={0} onChange={onChange} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "beng");
    await user.click(screen.getByRole("option", { name: /Bengaluru/ }));
    expect(onChange).toHaveBeenCalledWith("blr");
    expect(input).toHaveValue("Bengaluru");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("multi select: chips render at the bottom of the menu and the input clears", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Autosuggest options={CITIES} label="Cities" multiple debounce={0} onChange={onChange} />,
    );
    const input = screen.getByRole("combobox");

    await user.type(input, "mum");
    await user.click(screen.getByRole("option", { name: /Mumbai/ }));
    expect(onChange).toHaveBeenLastCalledWith(["mum"]);
    expect(input).toHaveValue("");

    // with a fresh query the list is back — the Mumbai chip sits after it in the menu
    await user.type(input, "del");
    const list = screen.getByRole("listbox");
    const chip = screen.getByText("Mumbai"); // only present as a chip now
    expect(list.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(screen.getByRole("option", { name: /New Delhi/ }));
    expect(onChange).toHaveBeenLastCalledWith(["mum", "del"]);

    await user.click(screen.getByRole("button", { name: "Remove Mumbai" }));
    expect(onChange).toHaveBeenLastCalledWith(["del"]);
  });

  it("multi: chips show in the field when blurred and move into the menu when focused", async () => {
    const user = userEvent.setup();
    render(
      <Autosuggest
        options={CITIES}
        label="Cities"
        multiple
        debounce={0}
        defaultValue={["mum", "del"]}
      />,
    );
    const input = screen.getByRole("combobox");

    // blurred: chips visible, NOT inside the menu
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("Mumbai").closest("div.absolute")).toBeNull();
    expect(screen.getByRole("button", { name: "Remove Mumbai" })).toBeInTheDocument();

    // focused: chips move into the menu popover
    await user.click(input);
    expect(screen.getByText("Mumbai").closest("div.absolute")).not.toBeNull();

    // blur again: chips back in the field
    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("Mumbai").closest("div.absolute")).toBeNull();
  });

  describe("creatable", () => {
    it("adds a free-text entry from the create row (multi)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Autosuggest
          options={CITIES}
          label="Cities"
          multiple
          debounce={0}
          creatable
          onChange={onChange}
        />,
      );
      await user.click(screen.getByRole("combobox"));
      const createInput = screen.getByRole("textbox", { name: "Create a new option" });
      await user.type(createInput, "Nashik");
      await user.click(screen.getByRole("button", { name: "Add" }));
      expect(onChange).toHaveBeenLastCalledWith(["Nashik"]);
      expect(createInput).toHaveValue("");
    });

    it("onCreate maps the text to a value; single select commits + closes on Enter", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCreate = vi.fn((t: string) => ({ value: `new:${t.toLowerCase()}`, label: t }));
      render(
        <Autosuggest
          options={CITIES}
          label="City"
          debounce={0}
          creatable
          onCreate={onCreate}
          onChange={onChange}
        />,
      );
      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByRole("textbox", { name: "Create a new option" }), "Nashik");
      await user.keyboard("{Enter}");
      expect(onCreate).toHaveBeenCalledWith("Nashik");
      expect(onChange).toHaveBeenLastCalledWith("new:nashik");
      expect(screen.getByRole("combobox")).toHaveValue("Nashik");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("Backspace on an empty multi input removes the last chip", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Autosuggest
        options={CITIES}
        label="Cities"
        multiple
        debounce={0}
        defaultValue={["mum", "del"]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(["mum"]);
  });

  it("clears value and query with the field ✕", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Autosuggest
        options={CITIES}
        label="City"
        debounce={0}
        defaultValue="blr"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("keyboard: arrow + Enter selects, Escape restores the input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Autosuggest options={CITIES} label="City" debounce={0} onChange={onChange} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "e");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = input.getAttribute("value")!;

    await user.type(input, "xyz");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue(picked);
  });

  it("respects minChars", async () => {
    const user = userEvent.setup();
    render(<Autosuggest options={CITIES} label="City" debounce={0} minChars={2} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "m");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.type(input, "u");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("does not open when disabled or readOnly", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Autosuggest options={CITIES} label="City" disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    rerender(<Autosuggest options={CITIES} label="City" readOnly defaultValue="blr" />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  describe("async", () => {
    it("calls loadOptions with the query and shows its results", async () => {
      const user = userEvent.setup();
      const loadOptions = vi.fn(async (q: string) =>
        CITIES.filter((c) => String(c.label).toLowerCase().includes(q.toLowerCase())),
      );
      render(<Autosuggest label="City" debounce={0} loadOptions={loadOptions} />);
      await user.type(screen.getByRole("combobox"), "beng");
      expect(await screen.findByRole("option", { name: /Bengaluru/ })).toBeInTheDocument();
      expect(loadOptions).toHaveBeenLastCalledWith("beng");
    });

    it("debounces onSearch by the given delay", async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<Autosuggest options={CITIES} label="City" debounce={120} onSearch={onSearch} />);
      await user.type(screen.getByRole("combobox"), "mum");
      expect(onSearch).not.toHaveBeenCalled(); // still within the debounce window
      await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith("mum"));
    });
  });

  describe("auto placement", () => {
    afterEach(() => vi.restoreAllMocks());

    it("flips the menu upward when there is no room below", async () => {
      const user = userEvent.setup();
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

      render(<Autosuggest options={CITIES} label="City" debounce={0} />);
      await user.type(screen.getByRole("combobox"), "m");
      expect(screen.getByRole("listbox").closest("div.absolute")!.className).toContain(
        "bottom-full",
      );
    });
  });
});

describe("Autosuggest (controlled)", () => {
  it("respects a controlled value / onChange", async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<string[] | string | null>([]);
      return (
        <Autosuggest
          options={CITIES}
          label="Cities"
          multiple
          debounce={0}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Host />);
    await user.type(screen.getByRole("combobox"), "beng");
    await user.click(screen.getByRole("option", { name: /Bengaluru/ }));
    expect(screen.getByText("Bengaluru")).toBeInTheDocument();
  });
});
