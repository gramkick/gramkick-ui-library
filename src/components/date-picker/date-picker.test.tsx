import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "./date-picker";

const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

const today = new Date();
const inThisMonth = (day: number) => new Date(today.getFullYear(), today.getMonth(), day);

describe("DatePicker", () => {
  it("wires label / hint / error like the other fields", () => {
    render(<DatePicker label="Date" hint="soon" error="required" />);
    const trigger = screen.getByRole("combobox", { name: "Date" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("opens the calendar, picks a day, closes, and reports the Date", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Date" onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: dayLabel(inThisMonth(15)) }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const picked = onChange.mock.calls[0]![0] as Date;
    expect(picked.getFullYear()).toBe(today.getFullYear());
    expect(picked.getMonth()).toBe(today.getMonth());
    expect(picked.getDate()).toBe(15);
    expect(screen.getByRole("combobox")).toHaveTextContent(
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(inThisMonth(15)),
    );
  });

  it("opens with keyboard; the month + year dropdowns default to and drive the view", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" />);
    screen.getByRole("combobox", { name: "Date" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const monthName = new Intl.DateTimeFormat(undefined, { month: "long" }).format(today);
    const monthBtn = screen.getByRole("combobox", { name: "Month" });
    const yearBtn = screen.getByRole("combobox", { name: "Year" });
    expect(monthBtn).toHaveTextContent(monthName);
    expect(yearBtn).toHaveTextContent(String(today.getFullYear()));

    await user.click(yearBtn);
    await user.click(screen.getByRole("option", { name: String(today.getFullYear() + 1) }));
    expect(yearBtn).toHaveTextContent(String(today.getFullYear() + 1));

    await user.click(monthBtn);
    await user.click(screen.getByRole("option", { name: "March" }));
    const march15 = new Date(today.getFullYear() + 1, 2, 15);
    expect(screen.getByRole("button", { name: dayLabel(march15) })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent("April");
  });

  it("disables days outside [min, max]", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" min={inThisMonth(10)} max={inThisMonth(20)} />);
    await user.click(screen.getByRole("combobox", { name: "Date" }));
    expect(screen.getByRole("button", { name: dayLabel(inThisMonth(5)) })).toBeDisabled();
    expect(screen.getByRole("button", { name: dayLabel(inThisMonth(15)) })).toBeEnabled();
    expect(screen.getByRole("button", { name: dayLabel(inThisMonth(25)) })).toBeDisabled();
    // arrows are gated by the bounds too
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("bounds the year dropdown and disables out-of-range months from min/max", async () => {
    const user = userEvent.setup();
    const y = today.getFullYear();
    render(
      <DatePicker
        label="Date"
        min={new Date(y, 5, 1)}
        max={new Date(y, 8, 30)}
        defaultValue={new Date(y, 6, 10)}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Date" }));

    await user.click(screen.getByRole("combobox", { name: "Year" }));
    const yearList = screen.getByRole("listbox", { name: "Year" });
    expect(
      within(yearList)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual([String(y)]);
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("combobox", { name: "Month" }));
    const monthOpts = within(screen.getByRole("listbox", { name: "Month" })).getAllByRole("option");
    expect(monthOpts[0]).toHaveAttribute("aria-disabled", "true"); // January < June (min)
    expect(monthOpts[6]).not.toHaveAttribute("aria-disabled"); // July is in range
    expect(monthOpts[11]).toHaveAttribute("aria-disabled", "true"); // December > September (max)
  });

  it("sets the year dropdown span via pastYears / futureYears", async () => {
    const user = userEvent.setup();
    const y = today.getFullYear();
    render(<DatePicker label="Date" pastYears={2} futureYears={1} />);
    await user.click(screen.getByRole("combobox", { name: "Date" }));
    await user.click(screen.getByRole("combobox", { name: "Year" }));
    const years = within(screen.getByRole("listbox", { name: "Year" }))
      .getAllByRole("option")
      .map((o) => Number(o.textContent));
    expect(years).toEqual([y - 2, y - 1, y, y + 1]);
  });

  it("sets the year dropdown span via absolute fromYear / toYear", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker label="Date" fromYear={2000} toYear={2004} defaultValue={new Date(2002, 5, 1)} />,
    );
    await user.click(screen.getByRole("combobox", { name: "Date" }));
    await user.click(screen.getByRole("combobox", { name: "Year" }));
    const years = within(screen.getByRole("listbox", { name: "Year" }))
      .getAllByRole("option")
      .map((o) => Number(o.textContent));
    expect(years).toEqual([2000, 2001, 2002, 2003, 2004]);
  });

  it("clears the value with the field ✕", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Date" defaultValue={inThisMonth(12)} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [d, setD] = useState<Date | null>(null);
      return <DatePicker label="Date" value={d} onChange={setD} />;
    }
    render(<Host />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: dayLabel(inThisMonth(8)) }));
    expect(screen.getByRole("combobox")).toHaveTextContent(/8, \d{4}/);
  });
});
