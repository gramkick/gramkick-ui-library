import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Steps } from "./steps";
import { Button } from "../button/button";

const checkout = [
  { label: "Cart", description: "3 items" },
  { label: "Address", description: "Home · Pune" },
  { label: "Payment", description: "UPI" },
  { label: "Review", description: "Confirm & pay" },
];

const meta = {
  title: "Components/Steps",
  component: Steps,
  tags: ["autodocs"],
  args: { steps: checkout, current: 1 },
  argTypes: {
    variant: { control: "inline-radio", options: ["solid", "outline"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    clickable: { control: "boolean" },
    current: { control: { type: "number", min: 0, max: 3 } },
  },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};
export const Vertical: Story = { args: { orientation: "vertical" } };
export const Outline: Story = { args: { variant: "outline", current: 2 } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Steps {...args} size="sm" />
      <Steps {...args} size="md" />
      <Steps {...args} size="lg" />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    current: 2,
    steps: [
      { label: "Cart" },
      { label: "Address" },
      { label: "Payment", description: "Card declined", status: "error" },
      { label: "Review" },
    ],
  },
};

/** Alternate mode — pass `percent` for a segmented strength track (no `steps`). */
export const StrengthTrack: Story = {
  render: () => {
    const Demo = () => {
      const [pw, setPw] = useState("");
      const score = Math.min(
        100,
        pw.length * 12 + (/[0-9]/.test(pw) ? 15 : 0) + (/[^a-z0-9]/i.test(pw) ? 20 : 0),
      );
      return (
        <div className="flex max-w-sm flex-col gap-2">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Type a password"
            className="h-10 rounded-gk-md border border-line px-3 text-sm"
          />
          <Steps percent={score} showValue segments={4} aria-label="Password strength" />
        </div>
      );
    };
    return <Demo />;
  },
};

export const StrengthLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Steps percent={15} label="Very weak" />
      <Steps percent={45} label="Fair" />
      <Steps percent={80} label="Strong" />
      <Steps percent={100} label="Excellent" segments={6} size="lg" />
    </div>
  ),
};

function Wizard() {
  const [step, setStep] = useState(0);
  return (
    <div className="flex flex-col gap-6">
      <Steps steps={checkout} current={step} clickable onStepClick={setStep} />
      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button
          disabled={step === checkout.length - 1}
          onClick={() => setStep((s) => Math.min(s + 1, checkout.length - 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
export const Interactive: Story = { name: "Interactive wizard", render: () => <Wizard /> };
