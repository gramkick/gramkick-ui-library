import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./file-upload";

const meta = {
  title: "Components/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  args: { label: "Attachment" },
  argTypes: {
    variant: { control: "inline-radio", options: ["outline", "filled", "dropdown"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-5">
      <FileUpload {...args} size="sm" label="Small" />
      <FileUpload {...args} size="md" label="Medium" />
      <FileUpload {...args} size="lg" label="Large" />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-5">
      <FileUpload {...args} variant="outline" label="Outline" />
      <FileUpload {...args} variant="filled" label="Filled" />
    </div>
  ),
};

export const WithHint: Story = {
  args: {
    label: "Business licence",
    description: "PDF or image, up to 5 MB",
    hint: "Uploaded to the merchant KYC record.",
    accept: ".pdf,image/*",
    maxSize: 5 * 1024 * 1024,
  },
};

export const WithError: Story = {
  args: { label: "Business licence", error: "A licence document is required." },
};

export const Multiple: Story = {
  args: {
    label: "Product photos",
    multiple: true,
    accept: "image/*",
    maxFiles: 4,
    description: "Up to 4 images",
  },
};

export const Disabled: Story = {
  args: { label: "Attachment", disabled: true },
};

/**
 * Single-file mode renders the picked file **inside the zone** with view + delete
 * actions; clicking the zone re-opens the picker to replace it.
 */
export const SingleFileInZone: Story = {
  args: { label: "Avatar", accept: "image/*", description: "Square image works best" },
};

/**
 * `variant="dropdown"` — a compact `Dropdown`-style field. Picked files are a
 * horizontally-scrolling row of removable chips; the ✕ on the right clears them all.
 * Click anywhere in the field to add more.
 */
export const DropdownVariant: Story = {
  args: {
    label: "Product photos",
    variant: "dropdown",
    multiple: true,
    accept: "image/*",
    placeholder: "Add photos…",
  },
};

/**
 * The **view** button previews the file in the library `Dialog` by default
 * (`previewInDialog={false}` → new tab, `onView` → your own handler). `showView`
 * / `showDelete` toggle the per-file buttons.
 */
export const ViewInDialog: Story = {
  args: { label: "Receipt", accept: "image/*,application/pdf", showDelete: true },
};

/** Swap the default view / delete buttons for your own via `renderActions`. */
export const CustomActions: Story = {
  args: {
    label: "Contract",
    renderActions: ({ file, url, remove }) => (
      <div className="flex items-center gap-2 text-xs font-semibold">
        <a
          href={url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue hover:underline"
        >
          Preview
        </a>
        <button type="button" onClick={remove} className="text-danger hover:underline">
          Remove {file.name.slice(0, 12)}…
        </button>
      </div>
    ),
  },
};

function Controlled() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <FileUpload label="Attachment" multiple value={files} onChange={setFiles} />
      <p className="text-sm text-muted">{files.length} file(s) staged</p>
    </div>
  );
}
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };
