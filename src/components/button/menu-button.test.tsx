import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuButton, type MenuButtonItem } from "./menu-button";

const items = (edit = vi.fn(), remove = vi.fn()): MenuButtonItem[] => [
  { label: "Edit", onSelect: edit },
  { label: "Duplicate", disabled: true },
  { label: "Delete", onSelect: remove, destructive: true, separated: true },
];

describe("MenuButton", () => {
  it("renders a closed menu trigger", () => {
    render(<MenuButton label="Actions" items={items()} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on click and lists the actions", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<MenuButton label="Actions" items={items()} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("runs an item's onSelect and closes", async () => {
    const user = userEvent.setup();
    const edit = vi.fn();
    render(<MenuButton label="Actions" items={items(edit)} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(edit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("disables the disabled item", async () => {
    const user = userEvent.setup();
    render(<MenuButton label="Actions" items={items()} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("closes on Escape and on an outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MenuButton label="Actions" items={items()} />
        <button type="button">outside</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens with ArrowDown and moves focus into the list", async () => {
    const user = userEvent.setup();
    render(<MenuButton label="Actions" items={items()} />);
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("menu")).toHaveFocus());
  });

  it("keeps every buttonVariants variant/size on the trigger", () => {
    render(<MenuButton label="Actions" items={items()} variant="outline" size="sm" />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveClass("border-line", "h-9");
  });
});
