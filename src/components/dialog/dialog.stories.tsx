import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d="M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.5v3M8 5h.01" strokeLinecap="round" />
    </svg>
  );
}

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl", "full"] },
    placement: { control: "inline-radio", options: ["responsive", "center"] },
    variant: { control: "inline-radio", options: ["default", "danger", "warning", "success"] },
    showClose: { control: "boolean" },
    dismissibleByDrag: { control: "boolean" },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    trigger: <Button>Open dialog</Button>,
    title: "Store hours updated",
    description: "Customers will see the new timings on your storefront within a minute.",
    actions: [{ label: "Got it", variant: "primary" }],
  },
};

export const ConfirmDestructive: Story = {
  args: {
    trigger: <Button variant="danger">Delete merchant</Button>,
    variant: "danger",
    icon: <WarningIcon />,
    title: "Delete this merchant?",
    subtext: "Sharma Kirana Store · MRC-4821",
    description:
      "Their storefront, catalog and pending orders are removed permanently. This cannot be undone.",
    actions: [
      { label: "Cancel", variant: "outline" },
      { label: "Delete", variant: "danger", onClick: () => console.log("deleted") },
    ],
  },
};

export const TitleIconAndSubtext: Story = {
  args: {
    trigger: <Button variant="outline">Application details</Button>,
    titleStartIcon: <InfoIcon />,
    title: "Wholesale application",
    subtext: "Submitted 2 days ago",
    description: "Review the GST document and payout account before approving.",
    actions: [
      { label: "Close", variant: "ghost" },
      { label: "Approve", variant: "primary" },
    ],
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <Dialog
          key={size}
          size={size}
          trigger={<Button variant="outline">{size}</Button>}
          title={`size="${size}"`}
          description="The panel width scales with the size prop; content scrolls past the viewport height."
          actions={[{ label: "Done" }]}
        />
      ))}
    </div>
  ),
};

export const RichDescriptionNode: Story = {
  args: {
    trigger: <Button variant="outline">Payout terms</Button>,
    title: "Payout schedule",
    description: (
      <ul className="list-disc space-y-1 pl-4">
        <li>Orders settle T+2 working days.</li>
        <li>Minimum payout is ₹500.</li>
        <li>Bank account changes pause payouts for 24h.</li>
      </ul>
    ),
    actions: [{ label: "Understood" }],
  },
};

/**
 * Default `placement="responsive"`: resize the preview below ~640px and re-open —
 * the panel becomes a full-width bottom sheet with a grab handle you can **drag
 * down to dismiss** (`dismissibleByDrag={false}` disables that). `placement="center"`
 * keeps it centered at every width.
 */
export const ResponsiveBottomSheet: Story = {
  args: {
    trigger: <Button>Open (resize me)</Button>,
    title: "Add a delivery address",
    description:
      "On a narrow screen this opens as a bottom sheet; on desktop it's a centered modal.",
    actions: [
      { label: "Cancel", variant: "outline" },
      { label: "Save address", variant: "primary" },
    ],
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const NoCloseButton: Story = {
  args: {
    trigger: <Button>Start verification</Button>,
    showClose: false,
    title: "Verifying your details",
    description: "This takes a few seconds — please don't close the tab.",
    actions: [{ label: "Cancel", variant: "outline" }],
  },
};

function ControlledDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => setOpen(true)}>Open from outside</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Controlled dialog"
        description="Open state is owned by the parent via open / onOpenChange."
        actions={[{ label: "Close" }]}
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

/** Full control with the primitives when the prop API is not enough. */
export const Composable: Story = {
  render: () => (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button variant="outline">Composable</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Hand-built layout</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted">
          Assembled from <code>DialogRoot</code> / <code>DialogContent</code> /{" "}
          <code>DialogHeader</code> …
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  ),
};
