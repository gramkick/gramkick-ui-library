import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "./text";

const meta = {
  title: "Components/Typography",
  component: Text,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { children: "The quick brown fox jumps over the lazy dog", variant: "body" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "body-lg",
        "body",
        "body-sm",
        "caption",
        "overline",
        "label",
        "price",
        "price-original",
      ],
    },
    tone: {
      control: "inline-radio",
      options: ["default", "muted", "brand", "danger", "inverted", "inherit"],
    },
    weight: { control: "inline-radio", options: ["normal", "medium", "semibold", "bold"] },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
    truncate: { control: "boolean" },
    lineClamp: { control: { type: "number", min: 0, max: 5 } },
    as: { control: false },
    asChild: { control: false },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every role in the scale, top to bottom. */
export const Scale: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-5">
      <Text variant="display">Display — campaign headline</Text>
      <Heading level={1}>Heading 1 — page title</Heading>
      <Heading level={2}>Heading 2 — section</Heading>
      <Heading level={3}>Heading 3 — sub-section</Heading>
      <Heading level={4}>Heading 4 — card title</Heading>
      <Heading level={5}>Heading 5</Heading>
      <Heading level={6}>Heading 6</Heading>
      <Text variant="body-lg">
        Body large — the lead paragraph on a product page or the standfirst under a section heading.
        Comfortable measure, generous line height.
      </Text>
      <Text variant="body">
        Body — default running text. Aim for 60–75 characters per line for the most comfortable
        reading rhythm.
      </Text>
      <Text variant="body-sm">Body small — dense UI copy, list item metadata, table cells.</Text>
      <Text variant="caption" tone="muted">
        Caption — helper text, timestamps, fine print.
      </Text>
      <Text variant="overline" tone="muted">
        Overline — eyebrow label
      </Text>
      <Text variant="label">Label — form fields, tabs, chips</Text>
    </div>
  ),
};

/** Detach the visual size from the semantic level with `variant`. */
export const SemanticVsVisual: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Heading level={2} variant="h4">
        An <code>&lt;h2&gt;</code> that looks like <code>h4</code>
      </Heading>
      <Text variant="body-sm" tone="muted">
        Keeps the document outline correct while matching a tighter layout.
      </Text>
    </div>
  ),
};

/** E-commerce building blocks composed from the scale. */
export const Ecommerce: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 rounded-gk-lg border border-line p-5">
      <Text variant="overline" tone="brand">
        New in
      </Text>
      <Text as="h3" variant="h4" lineClamp={2}>
        Alphonso Mangoes — Premium Grade, Box of 12
      </Text>
      <div className="flex items-baseline gap-2">
        <Text variant="price">₹1,299</Text>
        <Text variant="price-original">₹1,999</Text>
        <Text variant="label" tone="brand">
          35% off
        </Text>
      </div>
      <Text variant="body-sm" tone="muted">
        Free delivery by tomorrow · Sold by GramKick Farms
      </Text>
      <Text variant="caption" tone="muted">
        Inclusive of all taxes
      </Text>
    </div>
  ),
};

/** `truncate` for one line, `lineClamp={n}` for several. */
export const Overflow: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-4">
      <Text truncate>
        Single line that is cut with an ellipsis when it runs past the container width
      </Text>
      <Text variant="body-sm" lineClamp={2}>
        Two-line clamp — useful for product titles and card descriptions where a predictable height
        keeps the grid tidy no matter how long the copy runs.
      </Text>
    </div>
  ),
};

/** Renders on an `ink` surface — pair every `tone="inverted"` with a dark background. */
export const OnDark: Story = {
  parameters: { backgrounds: { default: "ink" } },
  render: () => (
    <div className="rounded-gk-lg bg-ink p-6">
      <Text variant="overline" tone="inverted">
        Limited time
      </Text>
      <Heading level={2} className="text-canvas">
        Monsoon sale — up to 50% off
      </Heading>
      <Text variant="body" tone="inverted" className="opacity-80">
        Shop staples, snacks and fresh produce before the offer ends Sunday.
      </Text>
    </div>
  ),
};
