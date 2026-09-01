import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from "./selection";

const meta = {
  title: "Components/Selection",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "Email me about order updates" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "outline", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    indeterminate: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxDefault: Story = { name: "Checkbox", args: { defaultChecked: true } };

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox variant="primary" defaultChecked label="Primary" />
      <Checkbox variant="secondary" defaultChecked label="Secondary" />
      <Checkbox variant="outline" defaultChecked label="Outline" />
      <Checkbox variant="danger" defaultChecked label="Danger" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox size="sm" defaultChecked label="Small" description="sm" />
      <Checkbox size="md" defaultChecked label="Medium" description="md" />
      <Checkbox size="lg" defaultChecked label="Large" description="lg" />
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => {
    const Demo = () => {
      const [items, setItems] = useState<string[]>(["a"]);
      const all = ["a", "b", "c"];
      return (
        <div className="flex flex-col gap-2">
          <Checkbox
            label="Select all"
            checked={items.length === all.length}
            indeterminate={items.length > 0 && items.length < all.length}
            onChange={(e) => setItems(e.target.checked ? all : [])}
          />
          <CheckboxGroup value={items} onChange={setItems} className="pl-6">
            <Checkbox value="a" label="Apples" />
            <Checkbox value="b" label="Bananas" />
            <Checkbox value="c" label="Cherries" />
          </CheckboxGroup>
        </div>
      );
    };
    return <Demo />;
  },
};

export const RadioGroupStory: Story = {
  name: "RadioGroup",
  render: () => (
    <RadioGroup
      defaultValue="standard"
      label="Delivery speed"
      options={[
        { value: "standard", label: "Standard", description: "3–5 business days" },
        { value: "express", label: "Express", description: "Next business day" },
        { value: "pickup", label: "Store pickup", description: "Ready in 2 hours", disabled: true },
      ]}
    />
  ),
};

export const RadioGroupHorizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="m" orientation="horizontal" variant="secondary" label="Size">
      <Radio value="s" label="S" />
      <Radio value="m" label="M" />
      <Radio value="l" label="L" />
      <Radio value="xl" label="XL" />
    </RadioGroup>
  ),
};

export const CheckboxGroupStory: Story = {
  name: "CheckboxGroup",
  render: () => {
    const Demo = () => {
      const [v, setV] = useState<string[]>(["sms"]);
      return (
        <div className="flex flex-col gap-2">
          <CheckboxGroup
            value={v}
            onChange={setV}
            label="Notifications"
            options={[
              { value: "email", label: "Email" },
              { value: "sms", label: "SMS" },
              { value: "push", label: "Push" },
            ]}
          />
          <p className="text-sm text-muted">{v.join(", ") || "none"}</p>
        </div>
      );
    };
    return <Demo />;
  },
};
