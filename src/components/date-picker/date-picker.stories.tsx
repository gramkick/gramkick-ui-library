import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DatePicker } from "./date-picker";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  args: { label: "Delivery date" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-72 pb-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: new Date() } };
/** The year dropdown span — relative (`pastYears` / `futureYears`) or absolute (`fromYear` / `toYear`). */
export const YearRange: Story = { args: { pastYears: 3, futureYears: 1 } };
export const WithHint: Story = { args: { hint: "Merchant-managed delivery ETA." } };
export const WithError: Story = { args: { error: "Choose a date at least 2 days out." } };
export const MinMax: Story = {
  args: {
    min: new Date(),
    max: new Date(Date.now() + 14 * 864e5),
    hint: "Within the next two weeks.",
  },
};
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <DatePicker {...args} size="sm" label="Small" />
      <DatePicker {...args} size="md" label="Medium" />
      <DatePicker {...args} size="lg" label="Large" />
    </div>
  ),
};

function Controlled() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <DatePicker label="Date" value={date} onChange={setDate} />
      <p className="text-sm text-muted">{date ? date.toDateString() : "—"}</p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

/** Near the bottom of the viewport so the calendar flips upward. */
export const FlipsUpward: Story = {
  decorators: [
    (Story) => (
      <div className="flex min-h-[92vh] w-72 items-end">
        <Story />
      </div>
    ),
  ],
};
