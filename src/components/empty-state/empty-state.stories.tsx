import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./empty-state";
import { Button } from "../button/button";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No orders yet",
    description: "Orders from your storefront will show up here once customers start buying.",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["empty", "error", "search"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    bordered: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-[34rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { actions: <Button size="sm">Share your store</Button> },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Couldn't load orders",
    description: "Something went wrong on our end. Try again in a moment.",
    actions: (
      <>
        <Button size="sm" onClick={() => {}}>
          Retry
        </Button>
        <Button size="sm" variant="ghost">
          Contact support
        </Button>
      </>
    ),
  },
};

export const NoResults: Story = {
  args: {
    variant: "search",
    title: "No matches for “kurta”",
    description: "Check the spelling or try a broader term.",
    actions: (
      <Button size="sm" variant="outline">
        Clear filters
      </Button>
    ),
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <EmptyState {...args} size="sm" bordered />
      <EmptyState {...args} size="md" bordered />
      <EmptyState {...args} size="lg" bordered />
    </div>
  ),
};

/** Dropped into an empty table body. */
export const InsideATable: Story = {
  render: (args) => (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-line text-left text-muted">
          <th className="py-2 font-medium">Order</th>
          <th className="py-2 font-medium">Customer</th>
          <th className="py-2 font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={3} className="py-4">
            <EmptyState {...args} size="sm" actions={<Button size="sm">Create order</Button>} />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};
