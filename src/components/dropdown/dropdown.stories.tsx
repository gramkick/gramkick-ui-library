import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dropdown, type DropdownOption } from "./dropdown";

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 1.5c2.5 0 4.5 2 4.5 4.5 0 3-4.5 8-4.5 8S3.5 9 3.5 6 5.5 1.5 8 1.5Z" />
      <circle cx="8" cy="6" r="1.6" />
    </svg>
  );
}

const CITIES: DropdownOption[] = [
  {
    value: "mum",
    label: "Mumbai",
    subtext: "Maharashtra",
    tertiary: "MH",
    icon: <PinIcon />,
    state: "Maharashtra",
  },
  {
    value: "del",
    label: "New Delhi",
    subtext: "Delhi",
    tertiary: "DL",
    icon: <PinIcon />,
    state: "Delhi",
  },
  {
    value: "blr",
    label: "Bengaluru",
    subtext: "Karnataka",
    tertiary: "KA",
    icon: <PinIcon />,
    state: "Karnataka",
  },
  {
    value: "hyd",
    label: "Hyderabad",
    subtext: "Telangana",
    tertiary: "TG",
    icon: <PinIcon />,
    state: "Telangana",
  },
  {
    value: "chn",
    label: "Chennai",
    subtext: "Tamil Nadu",
    tertiary: "TN",
    icon: <PinIcon />,
    state: "Tamil Nadu",
  },
  {
    value: "kol",
    label: "Kolkata",
    subtext: "West Bengal",
    tertiary: "WB",
    icon: <PinIcon />,
    state: "West Bengal",
  },
  {
    value: "pnq",
    label: "Pune",
    subtext: "Maharashtra",
    tertiary: "MH",
    icon: <PinIcon />,
    state: "Maharashtra",
    disabled: true,
  },
];

const meta = {
  title: "Components/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  args: { options: CITIES, label: "City", placeholder: "Pick a city" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    multiple: { control: "boolean" },
    searchable: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    invalid: { control: "boolean" },
    options: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-80 pb-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = { args: { defaultValue: "blr" } };

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ["mum", "blr"], label: "Serviceable cities" },
};

export const Searchable: Story = {
  args: {
    searchable: true,
    searchKeys: ["label", "state", "tertiary"],
    searchPlaceholder: "Search city or state…",
  },
};

export const SearchableMultiple: Story = {
  args: {
    multiple: true,
    searchable: true,
    searchKeys: ["label", "state"],
    label: "Serviceable cities",
  },
};

export const SelectAll: Story = {
  args: {
    multiple: true,
    selectAll: true,
    searchable: true,
    searchKeys: ["label", "state"],
    label: "Serviceable cities",
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Dropdown {...args} size="sm" label="Small" />
      <Dropdown {...args} size="md" label="Medium" />
      <Dropdown {...args} size="lg" label="Large" />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Dropdown {...args} variant="outline" label="Outline" />
      <Dropdown {...args} variant="filled" label="Filled" />
    </div>
  ),
};

export const WithHint: Story = {
  args: { hint: "Where the store fulfils orders from." },
};

export const WithError: Story = {
  args: { error: "Select at least one city." },
};

export const Disabled: Story = { args: { disabled: true, defaultValue: "del" } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "del" } };

/** Placed near the bottom of the viewport so the menu flips upward. */
export const FlipsUpward: Story = {
  args: { searchable: true },
  decorators: [
    (Story) => (
      <div className="flex min-h-[92vh] w-80 items-end">
        <Story />
      </div>
    ),
  ],
};

function Controlled() {
  const [value, setValue] = useState<string[] | string | null>(["mum"]);
  return (
    <div className="flex flex-col gap-3">
      <Dropdown
        options={CITIES}
        multiple
        label="Cities"
        value={value}
        onChange={setValue}
        removable
      />
      <p className="text-sm text-muted">value: {JSON.stringify(value)}</p>
    </div>
  );
}
export const ControlledMultiple: Story = { render: () => <Controlled /> };
