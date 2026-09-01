import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DateRange } from "../../lib/date";
import { DropdownRangePicker } from "./dropdown-range-picker";

const meta = {
  title: "Components/DropdownRangePicker",
  component: DropdownRangePicker,
  tags: ["autodocs"],
  args: { label: "Date range" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    allowCustom: { control: "boolean" },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-72 pb-[26rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DropdownRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const PresetsOnly: Story = { args: { allowCustom: false } };
export const CustomPresets: Story = {
  args: {
    presets: [
      {
        key: "q1",
        label: "Q1",
        getRange: (t) => ({
          start: new Date(t.getFullYear(), 0, 1),
          end: new Date(t.getFullYear(), 2, 31),
        }),
      },
      {
        key: "q2",
        label: "Q2",
        getRange: (t) => ({
          start: new Date(t.getFullYear(), 3, 1),
          end: new Date(t.getFullYear(), 5, 30),
        }),
      },
      {
        key: "ytd",
        label: "Year to date",
        getRange: (t) => ({ start: new Date(t.getFullYear(), 0, 1), end: t }),
      },
    ],
  },
};
export const WithError: Story = { args: { error: "Pick a range." } };

function Controlled() {
  const [range, setRange] = useState<DateRange | null>(null);
  const [key, setKey] = useState<string>();
  return (
    <div className="flex flex-col gap-2">
      <DropdownRangePicker
        label="Range"
        value={range}
        onChange={(r, k) => {
          setRange(r.start ? r : null);
          setKey(k);
        }}
      />
      <p className="text-sm text-muted">
        {key ?? "—"} ·{" "}
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
      <div className="flex min-h-[92vh] w-72 items-end">
        <Story />
      </div>
    ),
  ],
};
