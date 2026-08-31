import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

function Dot() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
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

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Approved" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["neutral", "success", "warning", "danger", "info", "outline"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    leftIcon: { control: false },
    rightIcon: { control: false },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

/** Text can come from the `label` prop instead of children. */
export const FromLabelProp: Story = {
  args: { children: undefined, label: "Approved", variant: "success" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="info" leftIcon={<Dot />}>
        Small
      </Badge>
      <Badge size="md" variant="info" leftIcon={<Dot />}>
        Medium
      </Badge>
      <Badge size="lg" variant="info" leftIcon={<Dot />}>
        Large
      </Badge>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="success">Approved</Badge>
      <Badge variant="warning">On hold</Badge>
      <Badge variant="danger">Rejected</Badge>
      <Badge variant="info">Pending</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="info" leftIcon={<Dot />}>
        Pending review
      </Badge>
      <Badge variant="success" leftIcon={<CheckIcon />}>
        Approved
      </Badge>
      <Badge variant="danger" leftIcon={<XIcon />}>
        Rejected
      </Badge>
      <Badge variant="outline" rightIcon={<XIcon />}>
        GST · remove
      </Badge>
    </div>
  ),
};
