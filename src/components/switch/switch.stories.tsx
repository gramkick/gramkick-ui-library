import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { label: "Email notifications" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "outline", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { defaultChecked: true } };

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch variant="primary" defaultChecked label="Primary" />
      <Switch variant="secondary" defaultChecked label="Secondary" />
      <Switch variant="outline" defaultChecked label="Outline" />
      <Switch variant="danger" defaultChecked label="Danger" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch size="sm" defaultChecked label="Small" />
      <Switch size="md" defaultChecked label="Medium" />
      <Switch size="lg" defaultChecked label="Large" />
    </div>
  ),
};

export const WithDescription: Story = {
  args: {
    label: "Two-factor auth",
    description: "Require an OTP on every new device sign-in.",
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch disabled label="Off + disabled" />
      <Switch disabled defaultChecked label="On + disabled" />
    </div>
  ),
};

function Controlled() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Switch label="Maintenance mode" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <p className="text-sm text-muted">{on ? "ON" : "OFF"}</p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };
