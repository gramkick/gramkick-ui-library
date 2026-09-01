import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MenuButton } from "./menu-button";

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M11.5 2.5l2 2L6 12l-3 1 1-3 7.5-7.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
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
  title: "Components/MenuButton",
  component: MenuButton,
  tags: ["autodocs"],
  args: {
    label: "Actions",
    items: [
      { label: "Edit", icon: <EditIcon />, onSelect: () => alert("Edit") },
      { label: "Duplicate", icon: <CopyIcon />, onSelect: () => alert("Duplicate") },
      {
        label: "Delete",
        icon: <TrashIcon />,
        destructive: true,
        separated: true,
        onSelect: () => alert("Delete"),
      },
    ],
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "outline", "ghost", "danger", "link"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    align: { control: "inline-radio", options: ["start", "end"] },
    openOnHover: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-start justify-center p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Outline: Story = { args: { variant: "outline" } };

export const OpensOnHover: Story = { args: { variant: "secondary", openOnHover: true } };

export const AlignEnd: Story = {
  args: { align: "end" },
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-start justify-end p-6">
        <Story />
      </div>
    ),
  ],
};

export const WithDisabledItem: Story = {
  args: {
    items: [
      { label: "Rename", onSelect: () => alert("Rename") },
      { label: "Move (coming soon)", disabled: true },
      { label: "Archive", separated: true, onSelect: () => alert("Archive") },
    ],
  },
};

export const Controlled: Story = {
  render: (args) => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted">menu is {open ? "open" : "closed"}</p>
          <MenuButton {...args} onOpenChange={setOpen} />
        </div>
      );
    };
    return <Demo />;
  },
};
