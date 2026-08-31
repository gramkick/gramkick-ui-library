import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 3h8M4 6h8M11 3c0 3-2.5 4-5 4l5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1.7 10S4.7 4.5 10 4.5 18.3 10 18.3 10 15.3 15.5 10 15.5 1.7 10 1.7 10Z" />
      <circle cx="10" cy="10" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        d="M7.9 4.7A8 8 0 0 1 10 4.5c5.3 0 8.3 5.5 8.3 5.5a15.6 15.6 0 0 1-2.5 3.1M5 5.8A15.6 15.6 0 0 0 1.7 10S4.7 15.5 10 15.5c1 0 1.9-.2 2.7-.5"
        strokeLinecap="round"
      />
      <path d="M8.6 8.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
      <path d="M3 3l14 14" strokeLinecap="round" />
    </svg>
  );
}

const meta = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Store name" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    leftIcon: { control: false },
    rightIcon: { control: false },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: "Store name" } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-4">
      <Input {...args} size="sm" label="Small" placeholder="sm" />
      <Input {...args} size="md" label="Medium" placeholder="md" />
      <Input {...args} size="lg" label="Large" placeholder="lg" />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-4">
      <Input {...args} variant="outline" label="Outline" placeholder="outline" />
      <Input {...args} variant="filled" label="Filled" placeholder="filled" />
    </div>
  ),
};

export const WithHint: Story = {
  args: {
    label: "GST number",
    placeholder: "22AAAAA0000A1Z5",
    hint: "15-character GSTIN as printed on your certificate.",
  },
};

export const WithError: Story = {
  args: {
    label: "GST number",
    defaultValue: "22AAA",
    error: "That doesn't look like a valid GSTIN.",
  },
};

/** Left = decorative. Right = decorative *or* interactive (see PasswordReveal). */
export const WithIcons: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-4">
      <Input {...args} label="Search catalog" placeholder="Search…" leftIcon={<SearchIcon />} />
      <Input
        {...args}
        label="Price"
        placeholder="0.00"
        leftIcon={<RupeeIcon />}
        rightIcon={<span className="text-xs font-semibold">INR</span>}
        inputMode="decimal"
      />
      <Input {...args} label="Coupon" defaultValue="SAVE20" rightIcon={<CheckIcon />} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { label: "Store code", defaultValue: "MRC-4821", disabled: true },
};

export const ReadOnly: Story = {
  args: { label: "Merchant ID", defaultValue: "usr_9f2c1a", readOnly: true },
};

function PasswordField() {
  const [show, setShow] = useState(false);
  return (
    <Input
      containerClassName="w-72"
      label="Password"
      type={show ? "text" : "password"}
      defaultValue="hunter2"
      autoComplete="current-password"
      rightIcon={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="grid size-7 cursor-pointer place-items-center rounded-gk-sm text-muted transition-colors hover:bg-mint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

/** The right icon can be an interactive control — here an eye toggle. */
export const PasswordReveal: Story = {
  render: () => <PasswordField />,
};
