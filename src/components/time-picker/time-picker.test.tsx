import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimePicker } from "./time-picker";

const at = (h: number, m: number, s = 0) => {
  const d = new Date(2024, 0, 15);
  d.setHours(h, m, s, 0);
  return d;
};

const hourList = () => screen.getByRole("listbox", { name: "Hour" });
const minList = () => screen.getByRole("listbox", { name: "Min" });

describe("TimePicker", () => {
  it("wires label / hint / error like the other fields", () => {
    render(<TimePicker label="Time" hint="soon" error="required" />);
    const trigger = screen.getByRole("combobox", { name: "Time" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("opens, picks an hour and minute, and reports a Date", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker label="Time" hour12={false} onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(hourList()).getByRole("option", { name: "14" }));
    await user.click(within(minList()).getByRole("option", { name: "30" }));

    const picked = onChange.mock.lastCall![0] as Date;
    expect(picked.getHours()).toBe(14);
    expect(picked.getMinutes()).toBe(30);
    expect(screen.getByRole("combobox")).toHaveTextContent(/14.30/);
  });

  it("marks the selected option and keeps the popover open until Done", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" hour12={false} defaultValue={at(10, 0)} />);
    await user.click(screen.getByRole("combobox"));

    await user.click(within(hourList()).getByRole("option", { name: "16" }));
    expect(within(hourList()).getByRole("option", { name: "16" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables hours outside [min, max]", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" hour12={false} min={at(9, 0)} max={at(17, 30)} />);
    await user.click(screen.getByRole("combobox"));
    expect(within(hourList()).getByRole("option", { name: "08" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(hourList()).getByRole("option", { name: "12" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(within(hourList()).getByRole("option", { name: "18" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("minuteStep drives the minutes column", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" hour12={false} minuteStep={15} />);
    await user.click(screen.getByRole("combobox"));
    const minutes = within(minList())
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(minutes).toEqual(["00", "15", "30", "45"]);
  });

  it("withSeconds adds a seconds column", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" hour12={false} withSeconds secondStep={30} />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox", { name: "Sec" })).toBeInTheDocument();
    const secs = within(screen.getByRole("listbox", { name: "Sec" }))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(secs).toEqual(["00", "30"]);
  });

  it("hour12 shows AM/PM and picking PM shifts the hour to the afternoon", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker label="Time" hour12 onChange={onChange} defaultValue={at(9, 0)} />);
    await user.click(screen.getByRole("combobox"));

    await user.click(
      within(screen.getByRole("listbox", { name: "AM/PM" })).getByRole("option", { name: "PM" }),
    );
    const picked = onChange.mock.lastCall![0] as Date;
    expect(picked.getHours()).toBe(21);
  });

  it("clears the value with the field ✕", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker label="Time" defaultValue={at(12, 0)} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("Done closes the popover, keeping the picked value", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" hour12={false} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(within(hourList()).getByRole("option", { name: "07" }));
    await user.click(within(minList()).getByRole("option", { name: "45" }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent(/07.45/);
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies size and variant classes to the trigger", () => {
    render(<TimePicker label="Time" size="lg" variant="filled" />);
    expect(screen.getByRole("combobox", { name: "Time" })).toHaveClass("min-h-12", "bg-mint");
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [t, setT] = useState<Date | null>(null);
      return <TimePicker label="Time" hour12={false} value={t} onChange={setT} />;
    }
    render(<Host />);
    await user.click(screen.getByRole("combobox"));
    await user.click(within(hourList()).getByRole("option", { name: "07" }));
    expect(screen.getByRole("combobox")).toHaveTextContent(/07.\d{2}/);
  });
});
