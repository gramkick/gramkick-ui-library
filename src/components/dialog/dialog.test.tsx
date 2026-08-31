import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

describe("Dialog primitives", () => {
  function Example() {
    return (
      <DialogRoot>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete this merchant?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogContent>
      </DialogRoot>
    );
  }

  it("is closed until the trigger is activated", () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click with an accessible name", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Delete this merchant?" })).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can hide the built-in close button", async () => {
    render(
      <DialogRoot defaultOpen>
        <DialogContent showClose={false}>
          <DialogTitle>No close</DialogTitle>
        </DialogContent>
      </DialogRoot>,
    );
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});

describe("Dialog (prop-driven)", () => {
  it("is closed until the trigger is clicked, then shows title, subtext and description", async () => {
    render(
      <Dialog
        trigger={<Button>Open</Button>}
        title="Delete this merchant?"
        subtext="MRC-4821"
        description="This cannot be undone."
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("dialog", { name: "Delete this merchant?" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("MRC-4821")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("keeps an accessible name when no title is given", async () => {
    render(<Dialog trigger={<Button>Open</Button>} description="Body only." />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Dialog" })).toBeInTheDocument();
  });

  it("renders the actions list as buttons and fires their onClick", async () => {
    const onDelete = vi.fn();
    render(
      <Dialog
        defaultOpen
        title="Delete?"
        actions={[
          { label: "Cancel", variant: "outline" },
          { label: "Delete", variant: "danger", onClick: onDelete },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("closes after a default action, but not when closeOnClick is false", async () => {
    const onApply = vi.fn();
    render(
      <Dialog
        defaultOpen
        title="Settings"
        actions={[{ label: "Apply", onClick: onApply, closeOnClick: false }, { label: "Save" }]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("omits the close button when showClose is false", () => {
    render(<Dialog defaultOpen title="Working" showClose={false} />);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("gives the close (cross) button a pointer cursor", () => {
    render(<Dialog defaultOpen title="Close me" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("cursor-pointer");
  });

  it("supports controlled open state", async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            external
          </button>
          <Dialog open={open} onOpenChange={setOpen} title="Controlled" />
        </>
      );
    }
    render(<Host />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "external" }));
    expect(screen.getByRole("dialog", { name: "Controlled" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the mobile grab handle by default and hides it for placement=center", () => {
    const { rerender } = render(<Dialog defaultOpen title="Sheet" />);
    expect(document.querySelector('[data-slot="dialog-handle"]')).toBeInTheDocument();

    rerender(<Dialog defaultOpen title="Modal" placement="center" />);
    expect(document.querySelector('[data-slot="dialog-handle"]')).not.toBeInTheDocument();
  });

  it("applies the responsive bottom-sheet classes by default", () => {
    render(<Dialog defaultOpen title="Sheet" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bottom-0", "rounded-t-gk-lg");
    expect(dialog.className).toContain("sm:-translate-x-1/2");
  });

  describe("bottom-sheet drag-to-close (mobile viewport)", () => {
    // Force the mobile branch — jsdom's default viewport reports as desktop.
    beforeEach(() => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }));
    });
    afterEach(() => vi.unstubAllGlobals());

    // jsdom has no PointerEvent; a MouseEvent named as a pointer event carries
    // button/clientY through to React's synthetic handler.
    const drag = (el: Element, from: number, to: number) => {
      const opts = { bubbles: true, cancelable: true, button: 0 };
      fireEvent(el, new MouseEvent("pointerdown", { ...opts, clientY: from }));
      fireEvent(el, new MouseEvent("pointermove", { ...opts, clientY: to }));
      fireEvent(el, new MouseEvent("pointerup", { ...opts, clientY: to }));
    };

    it("closes when the grab handle is dragged down past the threshold", async () => {
      const onOpenChange = vi.fn();
      render(<Dialog defaultOpen onOpenChange={onOpenChange} title="Sheet" description="Drag" />);
      const handle = document.querySelector('[data-slot="dialog-handle"]') as HTMLElement;
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      drag(handle, 0, 260);

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("stays open on a small drag that does not reach the threshold", async () => {
      const onOpenChange = vi.fn();
      render(<Dialog defaultOpen onOpenChange={onOpenChange} title="Sheet" />);
      const handle = document.querySelector('[data-slot="dialog-handle"]') as HTMLElement;

      drag(handle, 0, 20);

      await new Promise((r) => setTimeout(r, 80));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not react to drag when dismissibleByDrag is false", async () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog defaultOpen onOpenChange={onOpenChange} title="Sheet" dismissibleByDrag={false} />,
      );
      const handle = document.querySelector('[data-slot="dialog-handle"]') as HTMLElement;

      drag(handle, 0, 260);

      await new Promise((r) => setTimeout(r, 80));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("renders a rich description node", async () => {
    render(
      <Dialog
        trigger={<Button>Open</Button>}
        title="Terms"
        description={
          <ul>
            <li>First point</li>
          </ul>
        }
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("First point")).toBeInTheDocument();
  });
});
