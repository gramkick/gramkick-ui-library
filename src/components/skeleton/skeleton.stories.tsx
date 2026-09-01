import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["text", "rounded", "rect", "circle"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    animation: { control: "inline-radio", options: ["pulse", "shimmer", "none"] },
    lines: { control: { type: "number", min: 1, max: 8 } },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { width: 220 } };
export const Paragraph: Story = { args: { lines: 4 } };

/** A highlight that sweeps left → right (honours `prefers-reduced-motion`). */
export const Shimmer: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Skeleton animation="shimmer" width={240} />
      <Skeleton animation="shimmer" variant="rounded" />
      <Skeleton animation="shimmer" lines={3} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Skeleton variant="text" width={200} />
      <Skeleton variant="rounded" />
      <Skeleton variant="rect" height={64} />
      <Skeleton variant="circle" size="lg" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Skeleton size="sm" width={180} />
      <Skeleton size="md" width={220} />
      <Skeleton size="lg" width={260} />
    </div>
  ),
};

/** Composed into a card placeholder. */
export const CardPlaceholder: Story = {
  render: () => (
    <div className="flex gap-3 rounded-gk-md border border-line p-4">
      <Skeleton variant="circle" size="md" />
      <div className="flex-1">
        <Skeleton width="55%" />
        <Skeleton size="sm" className="mt-2" width="80%" />
        <Skeleton variant="rounded" size="sm" className="mt-3" />
      </div>
    </div>
  ),
};

export const NoAnimation: Story = { args: { lines: 3, animation: "none" } };
