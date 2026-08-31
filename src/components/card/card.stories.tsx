import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["elevated", "raised", "outline", "ghost"] },
    radius: { control: "inline-radio", options: ["none", "sm", "md", "lg", "xl"] },
    interactive: { control: "boolean" },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSections: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Sharma Kirana Store</CardTitle>
        <CardDescription>Onboarding submitted · awaiting review</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted">
        Verify the GST document and payout account, then approve the merchant to open their
        storefront.
      </CardContent>
      <CardFooter>
        <Button size="sm">Approve</Button>
        <Button size="sm" variant="outline">
          Request changes
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-4">
      {(["elevated", "raised", "outline", "ghost"] as const).map((variant) => (
        <Card key={variant} variant={variant}>
          <CardHeader>
            <CardTitle className="capitalize">{variant}</CardTitle>
            <CardDescription>variant=&quot;{variant}&quot;</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted">Elevation + border treatment.</CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const Radii: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(["none", "sm", "md", "lg", "xl"] as const).map((radius) => (
        <Card key={radius} radius={radius} className="grid size-28 place-items-center text-sm">
          {radius}
        </Card>
      ))}
    </div>
  ),
};

/** A shadow with square corners — `variant="raised"` + `radius="none"`. */
export const ShadowWithoutRadius: Story = {
  args: { variant: "raised", radius: "none" },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Full-bleed panel</CardTitle>
        <CardDescription>shadow-art, no rounding</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted">
        Useful for sheets and edge-to-edge sections on mobile.
      </CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  args: { interactive: true, asChild: true },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <a href="https://gramkick.example" className="block no-underline">
        <CardHeader>
          <CardTitle>Sharma Kirana Store</CardTitle>
          <CardDescription>Tap to open the merchant application</CardDescription>
        </CardHeader>
      </a>
    </Card>
  ),
};
