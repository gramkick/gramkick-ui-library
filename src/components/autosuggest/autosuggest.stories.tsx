import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Autosuggest, type AutosuggestOption } from "./autosuggest";

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 1.5c2.5 0 4.5 2 4.5 4.5 0 3-4.5 8-4.5 8S3.5 9 3.5 6 5.5 1.5 8 1.5Z" />
      <circle cx="8" cy="6" r="1.6" />
    </svg>
  );
}

const CITIES: AutosuggestOption[] = [
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
  },
  {
    value: "ahm",
    label: "Ahmedabad",
    subtext: "Gujarat",
    tertiary: "GJ",
    icon: <PinIcon />,
    state: "Gujarat",
  },
];

const meta = {
  title: "Components/Autosuggest",
  component: Autosuggest,
  tags: ["autodocs"],
  args: { options: CITIES, label: "City", placeholder: "Start typing a city…" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    multiple: { control: "boolean" },
    debounce: { control: { type: "number" } },
    minChars: { control: { type: "number" } },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    invalid: { control: "boolean" },
    options: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-80 pb-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Autosuggest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const Multiple: Story = {
  args: { multiple: true, label: "Serviceable cities", searchKeys: ["label", "state"] },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Autosuggest {...args} size="sm" label="Small" />
      <Autosuggest {...args} size="md" label="Medium" />
      <Autosuggest {...args} size="lg" label="Large" />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Autosuggest {...args} variant="outline" label="Outline" />
      <Autosuggest {...args} variant="filled" label="Filled" />
    </div>
  ),
};

export const WithHint: Story = { args: { hint: "We match on city and state name." } };
export const WithError: Story = { args: { error: "Pick a city from the list." } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "blr" } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "blr" } };

export const MinChars: Story = {
  args: { minChars: 2, minCharsMessage: "Type at least 2 characters…" },
};

/**
 * Multi: the selected chips live inside the field while it's blurred, and move
 * into the menu (below the suggestions) while it's focused. `creatable` adds a
 * row with its own input + "Add" button to create entries that aren't options.
 */
export const MultiWithCreate: Story = {
  args: {
    multiple: true,
    label: "Tags",
    placeholder: "Search or add a tag…",
    searchKeys: ["label"],
    creatable: true,
    createPlaceholder: "New tag…",
    createLabel: "Add tag",
    defaultValue: ["mum"],
  },
};

/** Async source with a fake network delay + a configurable debounce. */
function AsyncDemo() {
  const loadOptions = (q: string) =>
    new Promise<AutosuggestOption[]>((resolve) => {
      setTimeout(
        () =>
          resolve(
            CITIES.filter(
              (c) =>
                String(c.label).toLowerCase().includes(q.toLowerCase()) ||
                String(c.state).toLowerCase().includes(q.toLowerCase()),
            ),
          ),
        600,
      );
    });
  return (
    <Autosuggest
      label="City (async)"
      placeholder="Type to search the server…"
      loadOptions={loadOptions}
      debounce={300}
      loadingMessage="Looking up cities…"
    />
  );
}
export const Async: Story = { render: () => <AsyncDemo /> };

function ControlledMultiDemo() {
  const [value, setValue] = useState<string[] | string | null>(["mum", "blr"]);
  return (
    <div className="flex flex-col gap-3">
      <Autosuggest
        options={CITIES}
        multiple
        label="Cities"
        searchKeys={["label", "state"]}
        value={value}
        onChange={setValue}
      />
      <p className="text-sm text-muted">value: {JSON.stringify(value)}</p>
    </div>
  );
}
export const ControlledMultiple: Story = { render: () => <ControlledMultiDemo /> };

/** Near the bottom of the viewport so the menu flips upward. */
export const FlipsUpward: Story = {
  args: { multiple: true },
  decorators: [
    (Story) => (
      <div className="flex min-h-[92vh] w-80 items-end">
        <Story />
      </div>
    ),
  ],
};
