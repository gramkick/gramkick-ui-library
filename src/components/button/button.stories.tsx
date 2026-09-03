import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9h6.6L13 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Get started" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "outline", "outline-brand", "outline-danger", "ghost", "danger", "link"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "icon"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    spinnerPlacement: { control: "inline-radio", options: ["start", "end"] },
    leftIcon: { control: false },
    rightIcon: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

/** Text can come from the `label` prop instead of children. */
export const FromLabelProp: Story = {
  args: { children: undefined, label: "Save changes" },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="outline-brand">
        Outline brand
      </Button>
      <Button {...args} variant="outline-danger">
        Outline danger
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} leftIcon={<PlusIcon />}>
        Add product
      </Button>
      <Button {...args} variant="outline" rightIcon={<ArrowRightIcon />}>
        Continue
      </Button>
      <Button {...args} variant="danger" leftIcon={<TrashIcon />}>
        Delete
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  args: { size: "icon", "aria-label": "Add product", children: <PlusIcon /> },
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>Get started</Button>
      <Button {...args} variant="outline" leftIcon={<PlusIcon />}>
        Add product
      </Button>
      <Button {...args} size="icon" aria-label="Saving">
        <PlusIcon />
      </Button>
    </div>
  ),
};

export const LoadingWithText: Story = {
  args: { loading: true, loadingText: "Saving…", children: "Save changes" },
};

export const LoadingSpinnerAtEnd: Story = {
  args: {
    loading: true,
    loadingText: "Processing…",
    spinnerPlacement: "end",
    children: "Pay ₹699",
  },
};

export const AsLink: Story = {
  args: { asChild: true },
  render: (args) => (
    <Button {...args}>
      <a href="https://gramkick.example">Visit GramKick</a>
    </Button>
  ),
};
