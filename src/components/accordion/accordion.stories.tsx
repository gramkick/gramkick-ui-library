import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./accordion";
import { ShieldCheckIcon, TruckIcon, HelpCircleIcon } from "../icon";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["separated", "contained", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    type: { control: "inline-radio", options: ["single", "multiple"] },
    collapsible: { control: "boolean" },
  },
  args: { variant: "separated", size: "md", type: "single", collapsible: true },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  {
    value: "delivery",
    title: "How fast is delivery?",
    icon: <TruckIcon />,
    content: "Most orders from nearby stores arrive in 30–45 minutes. The store page shows a live estimate before you check out.",
  },
  {
    value: "privacy",
    title: "How is my data used?",
    icon: <ShieldCheckIcon />,
    content: "Only to deliver your orders and support your account. You can request access or deletion at any time.",
  },
  {
    value: "help",
    title: "How do I contact support?",
    icon: <HelpCircleIcon />,
    content: "Tap the assistant button, or email the support address in Account → Help & support.",
  },
];

export const Playground: Story = {
  args: { items: ITEMS, defaultValue: "delivery" },
  render: (args) => (
    <div className="max-w-[420px]">
      <Accordion {...args} />
    </div>
  ),
};

export const Variants: Story = {
  args: { items: ITEMS },
  render: (args) => (
    <div className="grid max-w-[420px] gap-6">
      <Accordion {...args} variant="separated" defaultValue="delivery" />
      <Accordion {...args} variant="contained" defaultValue="delivery" />
      <Accordion {...args} variant="ghost" defaultValue="delivery" />
    </div>
  ),
};

export const Sizes: Story = {
  args: { items: ITEMS, variant: "contained" },
  render: (args) => (
    <div className="grid max-w-[420px] gap-6">
      <Accordion {...args} size="sm" defaultValue="delivery" />
      <Accordion {...args} size="md" defaultValue="delivery" />
      <Accordion {...args} size="lg" defaultValue="delivery" />
    </div>
  ),
};

export const Multiple: Story = {
  args: { items: ITEMS, type: "multiple", variant: "ghost", defaultValue: ["delivery", "help"] },
  render: (args) => (
    <div className="max-w-[420px]">
      <Accordion {...args} />
    </div>
  ),
};
