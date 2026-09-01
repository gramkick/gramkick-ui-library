import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TimePicker } from "./time-picker";

const at = (h: number, m: number, s = 0) => {
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
};

const meta = {
  title: "Components/TimePicker",
  component: TimePicker,
  tags: ["autodocs"],
  args: { label: "Pickup time" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    withSeconds: { control: "boolean" },
    hour12: { control: "boolean" },
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
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: at(14, 30) } };
export const TwelveHour: Story = { args: { hour12: true, defaultValue: at(9, 5) } };
export const WithSeconds: Story = {
  args: { withSeconds: true, secondStep: 5, defaultValue: at(8, 0, 0) },
};
export const MinuteStep: Story = { args: { minuteStep: 15 } };
export const Bounded: Story = {
  args: { min: at(9, 0), max: at(17, 30), hint: "Between 09:00 and 17:30." },
};
export const WithError: Story = { args: { error: "A pickup time is required." } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <TimePicker {...args} size="sm" label="Small" />
      <TimePicker {...args} size="md" label="Medium" />
      <TimePicker {...args} size="lg" label="Large" />
    </div>
  ),
};

function Controlled() {
  const [time, setTime] = useState<Date | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <TimePicker label="Time" value={time} onChange={setTime} />
      <p className="text-sm text-muted">{time ? time.toLocaleTimeString() : "—"}</p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

/** Near the bottom of the viewport so the popover flips upward. */
export const FlipsUpward: Story = {
  decorators: [
    (Story) => (
      <div className="flex min-h-[92vh] w-72 items-end">
        <Story />
      </div>
    ),
  ],
};
