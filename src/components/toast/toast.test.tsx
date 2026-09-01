import {
  act,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastMessenger, ToastProvider, useToast } from "./toast";

afterEach(() => {
  ToastMessenger.clear();
  ToastMessenger.configure({ position: "bottom-right", duration: 5000, max: 4 });
});

/** Run an imperative toast call inside act() and return its result. */
const run = <T,>(fn: () => T): T => {
  let out!: T;
  act(() => {
    out = fn();
  });
  return out;
};

describe("ToastMessenger (imperative, no provider)", () => {
  it("renders a toast from anywhere with title / description / role", async () => {
    run(() => ToastMessenger({ title: "Saved", description: "All changes stored." }));
    const t = await screen.findByRole("status");
    expect(within(t).getByText("Saved")).toBeInTheDocument();
    expect(within(t).getByText("All changes stored.")).toBeInTheDocument();
  });

  it("show: false renders nothing", async () => {
    run(() => ToastMessenger({ show: false, title: "hidden" }));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
  });

  it("success / error pick the tone and live-region politeness", async () => {
    run(() => ToastMessenger.success("Order placed"));
    run(() => ToastMessenger.error("Payment failed"));
    const ok = await screen.findByText("Order placed");
    expect(ok.closest('[data-slot="toast"]')).toHaveAttribute("data-variant", "accent");
    const bad = screen.getByRole("alert");
    expect(within(bad).getByText("Payment failed")).toBeInTheDocument();
    expect(bad).toHaveAttribute("aria-live", "assertive");
  });

  it("auto-dismisses after the duration", async () => {
    run(() => ToastMessenger({ title: "Fleeting", duration: 40 }));
    await screen.findByText("Fleeting");
    await waitForElementToBeRemoved(() => screen.queryByText("Fleeting"));
  });

  it("duration 0 stays until the ✕; dismissible: false hides the ✕", async () => {
    const user = userEvent.setup();
    run(() => ToastMessenger({ title: "Sticky", duration: 0 }));
    const t = await screen.findByRole("status");
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Sticky")).toBeInTheDocument();
    await user.click(within(t).getByRole("button", { name: "Dismiss" }));
    await waitForElementToBeRemoved(() => screen.queryByText("Sticky"));

    run(() => ToastMessenger({ title: "NoClose", duration: 0, dismissible: false }));
    const t2 = await screen.findByRole("status");
    expect(within(t2).queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  it("renders `actions` nodes and runs their handlers", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    run(() =>
      ToastMessenger({
        title: "Deleted",
        duration: 0,
        actions: <button onClick={onUndo}>Undo</button>,
      }),
    );
    const t = await screen.findByRole("status");
    await user.click(within(t).getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalled();
  });

  it("update() replaces a live toast in place", async () => {
    const id = run(() => ToastMessenger({ title: "Uploading…", duration: 0 }));
    await screen.findByText("Uploading…");
    run(() => ToastMessenger.update(id, { title: "Uploaded", variant: "accent" }));
    await screen.findByText("Uploaded");
    expect(screen.queryByText("Uploading…")).not.toBeInTheDocument();
  });

  it("configure({ max }) caps the stack, dropping the oldest", async () => {
    run(() => ToastMessenger.configure({ max: 2, duration: 0 }));
    run(() => ToastMessenger({ title: "One" }));
    run(() => ToastMessenger({ title: "Two" }));
    run(() => ToastMessenger({ title: "Three" }));
    await screen.findByText("Three");
    expect(screen.queryByText("One")).not.toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("dismissAll() clears everything", async () => {
    run(() => ToastMessenger.configure({ duration: 0 }));
    run(() => ToastMessenger({ title: "A" }));
    run(() => ToastMessenger({ title: "B" }));
    await screen.findByText("A");
    run(() => ToastMessenger.dismissAll());
    await waitFor(() => {
      expect(screen.queryByText("A")).not.toBeInTheDocument();
      expect(screen.queryByText("B")).not.toBeInTheDocument();
    });
  });
});

describe("ToastProvider + useToast", () => {
  function Inner({ onReady }: { onReady: (api: ReturnType<typeof useToast>) => void }) {
    onReady(useToast());
    return null;
  }

  it("renders the stack in-tree and honours provider config", async () => {
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider position="top-center" duration={0}>
        <Inner onReady={(a) => (api = a)} />
      </ToastProvider>,
    );
    run(() => api.toast({ title: "In tree" }));
    const region = (await screen.findByText("In tree")).closest('[data-slot="toast-region"]')!;
    expect(region).toHaveClass("top-0");
    // only one region while the provider is mounted
    expect(document.querySelectorAll('[data-slot="toast-region"]')).toHaveLength(1);
  });
});
