import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DateRange } from "../../lib/date";
import { DateRangePicker } from "./date-range-picker";

const meta = {
  title: "Components/DateRangePicker",
  component: DateRangePicker,
  tags: ["autodocs"],
  args: { label: "Reporting period" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    monthsToShow: { control: { type: "number", min: 1, max: 3 } },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-80 pb-[28rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OneMonth: Story = { args: { monthsToShow: 1 } };
/** A quick-preset list beside the calendar (above it on mobile). */
export const WithPresets: Story = { args: { showPresets: true } };
export const WithValue: Story = {
  args: {
    defaultValue: { start: new Date(), end: new Date(Date.now() + 6 * 864e5) },
  },
};
export const WithError: Story = { args: { error: "Select both a start and end date." } };

function Controlled() {
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <DateRangePicker label="Period" value={range} onChange={setRange} />
      <p className="text-sm text-muted">
        {range?.start && range?.end
          ? `${range.start.toDateString()} → ${range.end.toDateString()}`
          : "—"}
      </p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

export const FlipsUpward: Story = {
  decorators: [
    (Story) => (
      <div className="flex min-h-[92vh] w-80 items-end">
        <Story />
      </div>
    ),
  ],
};
