import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListItems } from "./list-items";

function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
    </svg>
  );
}

const people = [
  {
    value: "asha",
    label: "Asha Rao",
    subtext: "asha@store.in",
    tertiary: "Owner",
    icon: <UserIcon />,
  },
  {
    value: "vikram",
    label: "Vikram Shah",
    subtext: "vikram@store.in",
    tertiary: "Manager",
    icon: <UserIcon />,
  },
  {
    value: "neha",
    label: "Neha Kulkarni",
    subtext: "neha@store.in",
    tertiary: "Staff",
    icon: <UserIcon />,
  },
  {
    value: "raj",
    label: "Raj Patel",
    subtext: "Removed",
    tertiary: "—",
    icon: <UserIcon />,
    disabled: true,
  },
];

const meta = {
  title: "Components/ListItems",
  component: ListItems,
  tags: ["autodocs"],
  args: { options: people, "aria-label": "Team members" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled", "plain"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    multiple: { control: "boolean" },
    selectable: { control: "boolean" },
    selectAll: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListItems>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = { args: { defaultValue: "vikram" } };
export const Multiple: Story = {
  args: { multiple: true, selectAll: true, defaultValue: ["asha"] },
};

const catalogue = {
  "Food & oil": [
    { value: "ghee", label: "Ghee", tertiary: "1 kg" },
    { value: "sunflower-oil", label: "Sunflower oil", tertiary: "1 L" },
  ],
  "Rice & grain": [
    { value: "basmati", label: "Basmati rice", tertiary: "5 kg" },
    { value: "sona-masoori", label: "Sona Masoori rice", tertiary: "10 kg" },
  ],
  "Pulses & dals": [
    { value: "toor", label: "Toor dal", tertiary: "1 kg" },
    { value: "moong", label: "Moong dal", tertiary: "1 kg", disabled: true },
  ],
};

export const Categories: Story = {
  args: { isCategoriesList: true, options: catalogue, "aria-label": "Catalogue" },
};

export const CategoriesMultiple: Story = {
  args: {
    isCategoriesList: true,
    options: catalogue,
    "aria-label": "Catalogue",
    multiple: true,
    selectAll: true,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <ListItems {...args} size="sm" />
      <ListItems {...args} size="md" />
      <ListItems {...args} size="lg" />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <ListItems {...args} variant="outline" />
      <ListItems {...args} variant="filled" />
      <ListItems {...args} variant="plain" />
    </div>
  ),
};

/** `selectable={false}` — a plain menu: rows still fire `onItemClick`. */
export const DisplayOnly: Story = {
  args: { selectable: false },
  render: (args) => <ListItems {...args} onItemClick={(o) => alert(o.value)} />,
};

function Controlled() {
  const [value, setValue] = useState<string[]>(["asha", "neha"]);
  return (
    <div className="flex flex-col gap-2">
      <ListItems
        options={people}
        multiple
        selectAll
        value={value}
        onChange={(v) => setValue(v as string[])}
        aria-label="Team members"
      />
      <p className="text-sm text-muted">{value.join(", ") || "none"}</p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };
