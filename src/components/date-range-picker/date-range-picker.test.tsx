import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./date-range-picker";

const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

const today = new Date();
const day = (n: number) => new Date(today.getFullYear(), today.getMonth(), n);

describe("DateRangePicker", () => {
  it("picks start then end, normalizes order, fires onChange once, closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateRangePicker label="Period" onChange={onChange} monthsToShow={1} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: dayLabel(day(18)) }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: dayLabel(day(6)) }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const r = onChange.mock.calls[0]![0] as { start: Date; end: Date };
    expect(r.start.getDate()).toBe(6);
    expect(r.end.getDate()).toBe(18);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the range text once complete and clears it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateRangePicker
        label="Period"
        defaultValue={{ start: day(3), end: day(9) }}
        onChange={onChange}
        monthsToShow={1}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("–");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith({ start: null, end: null });
  });

  it("applies a preset from the preset list when showPresets is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateRangePicker label="Period" showPresets onChange={onChange} monthsToShow={1} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Last 7 days" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const r = onChange.mock.calls[0]![0] as { start: Date; end: Date };
    expect(Math.round((r.end.getTime() - r.start.getTime()) / 864e5)).toBe(6);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("–");
  });

  it("wires error state", () => {
    render(<DateRangePicker label="Period" error="need both dates" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("need both dates")).toBeInTheDocument();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Period" disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
