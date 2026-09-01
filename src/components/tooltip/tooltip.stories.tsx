import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "./tooltip";
import { Button } from "../button/button";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: { content: "Copied to clipboard" },
  argTypes: {
    variant: { control: "inline-radio", options: ["dark", "light", "accent", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    side: { control: "inline-radio", options: ["top", "bottom", "left", "right"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    arrow: { control: "boolean" },
    trigger: { control: "inline-radio", options: ["hover", "focus", "click"] },
  },
  decorators: [
    (Story) => (
      <div className="grid min-h-64 place-items-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: (args) => (
    <div className="flex gap-6">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Tooltip key={side} {...args} side={side} content={`On ${side}`}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-6">
      {(["dark", "light", "accent", "danger"] as const).map((variant) => (
        <Tooltip key={variant} variant={variant} content={variant} defaultOpen>
          <Button variant="ghost">{variant}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const NoArrow: Story = {
  render: (args) => (
    <Tooltip {...args} arrow={false} content="No triangle tip">
      <Button variant="outline">No tip</Button>
    </Tooltip>
  ),
};

export const RichWithActions: Story = {
  render: () => {
    const Demo = () => {
      const [saved, setSaved] = useState(false);
      return (
        <Tooltip
          trigger="click"
          variant="light"
          side="bottom"
          content="Unsaved changes"
          description="You have edits that haven't been published yet."
          actions={
            <>
              <Button size="sm" onClick={() => setSaved(true)}>
                {saved ? "Saved" : "Save now"}
              </Button>
              <Button size="sm" variant="ghost">
                Discard
              </Button>
            </>
          }
        >
          <Button variant="outline">Review</Button>
        </Tooltip>
      );
    };
    return <Demo />;
  },
};

export const LongText: Story = {
  render: (args) => (
    <Tooltip
      {...args}
      content="This tooltip has a long body that wraps onto several lines and never grows past maxWidth or the viewport edge."
    >
      <Button variant="outline">Long tooltip</Button>
    </Tooltip>
  ),
};
