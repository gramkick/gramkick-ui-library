import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToastMessenger, ToastProvider, type ToastPosition } from "./toast";
import { Button } from "../button/button";

const meta = {
  title: "Components/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "inline-radio",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ] satisfies ToastPosition[],
    },
    duration: { control: { type: "number" } },
    max: { control: { type: "number" } },
  },
  args: { position: "bottom-right", duration: 5000, max: 4 },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `ToastMessenger` is a plain import — no hook, no provider needed. */
function Demo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          ToastMessenger.success("Order placed", { description: "#GK-48213 is confirmed." })
        }
      >
        Success
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          ToastMessenger.error("Payment failed", {
            description: "Card declined by the bank.",
            duration: 0,
          })
        }
      >
        Error
      </Button>
      <Button variant="secondary" onClick={() => ToastMessenger.info("Sync started")}>
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => ToastMessenger.warning("Low stock", { description: "3 units left." })}
      >
        Warning
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          ToastMessenger({
            title: "Draft saved",
            description: "You can keep editing.",
            duration: 0,
            actions: (
              <>
                <Button size="sm" variant="secondary">
                  Undo
                </Button>
                <Button size="sm" variant="ghost">
                  View
                </Button>
              </>
            ),
          })
        }
      >
        With actions (no auto-dismiss)
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const id = ToastMessenger({
            title: "Uploading…",
            variant: "light",
            duration: 0,
            dismissible: false,
          })!;
          setTimeout(
            () =>
              ToastMessenger.update(id, {
                title: "Uploaded",
                variant: "accent",
                duration: 3000,
                dismissible: true,
              }),
            1500,
          );
        }}
      >
        Update in place
      </Button>
      <Button variant="ghost" onClick={() => ToastMessenger.dismissAll()}>
        Dismiss all
      </Button>
    </div>
  );
}

/** No provider — `ToastMessenger` mounts its own outlet. */
export const Standalone: Story = { render: () => <Demo /> };

/** With `<ToastProvider>` for placement / config (and so `actions` share app context). */
export const WithProvider: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Demo />
    </ToastProvider>
  ),
};
