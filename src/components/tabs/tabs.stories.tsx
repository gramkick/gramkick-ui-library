import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 5l6-3 6 3-6 3-6-3Z" strokeLinejoin="round" />
      <path d="M2 5v6l6 3 6-3V5M8 8v6" strokeLinejoin="round" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
    </svg>
  );
}

const panel = (title: string) => (
  <div className="rounded-gk-md border border-line bg-canvas p-4 text-sm text-muted">
    {title} panel content.
  </div>
);

const items = [
  { value: "overview", label: "Overview", icon: <GridIcon />, content: panel("Overview") },
  { value: "orders", label: "Orders", icon: <BoxIcon />, badge: 12, content: panel("Orders") },
  { value: "settings", label: "Settings", icon: <CogIcon />, content: panel("Settings") },
  { value: "billing", label: "Billing", disabled: true, content: panel("Billing") },
];

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: { items, defaultValue: "overview" },
  argTypes: {
    variant: { control: "inline-radio", options: ["line", "solid", "soft", "enclosed"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    activationMode: { control: "inline-radio", options: ["automatic", "manual"] },
    items: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[32rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Tabs {...args} variant="line" />
      <Tabs {...args} variant="solid" />
      <Tabs {...args} variant="soft" />
      <Tabs {...args} variant="enclosed" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Tabs {...args} size="sm" />
      <Tabs {...args} size="md" />
      <Tabs {...args} size="lg" />
    </div>
  ),
};

/** Arrow keys move focus *and* activate; `manual` waits for Enter / Space / click. */
export const ManualActivation: Story = { args: { activationMode: "manual", variant: "solid" } };

function Controlled() {
  const [tab, setTab] = useState("orders");
  return (
    <div className="flex flex-col gap-3">
      <Tabs items={items} value={tab} onValueChange={setTab} variant="soft" />
      <p className="text-sm text-muted">
        Active: <code>{tab}</code>
      </p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

/** Composed API — full control over markup. */
export const Composed: Story = {
  render: () => (
    <Tabs defaultValue="a" variant="enclosed">
      <TabsList>
        <TabsTrigger value="a">First</TabsTrigger>
        <TabsTrigger value="b">Second</TabsTrigger>
        <TabsTrigger value="c" disabled>
          Third
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">{panel("First")}</TabsContent>
      <TabsContent value="b">{panel("Second")}</TabsContent>
      <TabsContent value="c">{panel("Third")}</TabsContent>
    </Tabs>
  ),
};
