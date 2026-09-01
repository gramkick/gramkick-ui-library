import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { addDays } from "../../lib/date";
import { DropdownRangePicker } from "./dropdown-range-picker";

const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

const today = new Date();
const day = (n: number) => new Date(today.getFullYear(), today.getMonth(), n);

describe("DropdownRangePicker", () => {
  it("lists presets and applies one with its key + label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DropdownRangePicker label="Range" onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Last 15 days" })).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Last 15 days" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [range, key] = onChange.mock.calls[0]!;
    expect(key).toBe("last-15");
    const expectedStart = addDays(
      new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      -14,
    );
    expect(range.start.getTime()).toBe(expectedStart.getTime());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Last 15 days");
  });

  it("Custom range swaps in the calendar and reports a custom range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DropdownRangePicker label="Range" onChange={onChange} monthsToShow={1} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Custom range" }));

    expect(screen.getByRole("button", { name: "Presets" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dayLabel(day(5)) }));
    await user.click(screen.getByRole("button", { name: dayLabel(day(12)) }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [range, key] = onChange.mock.calls[0]!;
    expect(key).toBe("custom");
    expect(range.start.getDate()).toBe(5);
    expect(range.end.getDate()).toBe(12);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can hide the Custom range row", async () => {
    const user = userEvent.setup();
    render(<DropdownRangePicker label="Range" allowCustom={false} />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("option", { name: "Custom range" })).not.toBeInTheDocument();
  });

  it("accepts custom presets", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DropdownRangePicker
        label="Range"
        onChange={onChange}
        presets={[
          {
            key: "ytd",
            label: "Year to date",
            getRange: (t) => ({ start: new Date(t.getFullYear(), 0, 1), end: t }),
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Year to date" }));
    expect(onChange.mock.calls[0]![1]).toBe("ytd");
    expect(screen.getByRole("combobox")).toHaveTextContent("Year to date");
  });

  it("wires error state and does not open when disabled", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DropdownRangePicker label="Range" error="pick one" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");

    rerender(<DropdownRangePicker label="Range" disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
