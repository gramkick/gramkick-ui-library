import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const items = [
  { value: "overview", label: "Overview", content: "Overview body" },
  { value: "orders", label: "Orders", content: "Orders body" },
  { value: "settings", label: "Settings", content: "Settings body" },
  { value: "billing", label: "Billing", disabled: true, content: "Billing body" },
];

describe("Tabs", () => {
  it("renders a tablist and selects the first enabled tab by default", () => {
    render(<Tabs items={items} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview body");
    expect(screen.queryByText("Orders body")).not.toBeInTheDocument();
  });

  it("honours defaultValue", () => {
    render(<Tabs items={items} defaultValue="settings" />);
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Settings body");
  });

  it("switches panels on click", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole("tab", { name: "Orders" }));
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Orders body");
  });

  it("wires aria-controls / aria-labelledby between tab and panel", () => {
    render(<Tabs items={items} defaultValue="orders" />);
    const tab = screen.getByRole("tab", { name: "Orders" });
    const panel = screen.getByRole("tabpanel");
    expect(tab.getAttribute("aria-controls")).toBe(panel.getAttribute("id"));
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.getAttribute("id"));
  });

  it("moves and activates with the arrow keys, wrapping and skipping disabled", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole("tab", { name: "Overview" }));

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Orders body");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();

    // Billing is disabled -> wrap straight back to Overview
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
  });

  it("manual activation only moves focus until Enter / Space", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} activationMode="manual" />);
    await user.click(screen.getByRole("tab", { name: "Overview" }));

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview body");

    await user.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Orders body");
  });

  it("does not select a disabled tab on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs items={items} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Billing" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Billing" })).toBeDisabled();
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Host() {
      const [v, setV] = useState("overview");
      return (
        <>
          <Tabs items={items} value={v} onValueChange={setV} />
          <span data-testid="v">{v}</span>
        </>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    expect(screen.getByTestId("v")).toHaveTextContent("settings");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Settings body");
  });

  it("applies variant + size classes and the data-state on the active tab", () => {
    render(<Tabs items={items} variant="solid" size="lg" defaultValue="orders" />);
    const active = screen.getByRole("tab", { name: "Orders" });
    const inactive = screen.getByRole("tab", { name: "Overview" });
    expect(active).toHaveClass("h-12", "rounded-gk-sm");
    expect(active).toHaveAttribute("data-state", "active");
    expect(inactive).toHaveAttribute("data-state", "inactive");
    expect(screen.getByRole("tablist")).toHaveClass("bg-mint");
  });

  it("composes with explicit children and keeps roving tabindex", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a" variant="enclosed">
        <TabsList>
          <TabsTrigger value="a">First</TabsTrigger>
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Body A</TabsContent>
        <TabsContent value="b">Body B</TabsContent>
      </Tabs>,
    );
    const first = screen.getByRole("tab", { name: "First" });
    const second = screen.getByRole("tab", { name: "Second" });
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");

    await user.click(second);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Body B");
    expect(second).toHaveAttribute("tabindex", "0");
    expect(first).toHaveAttribute("tabindex", "-1");
  });

  it("keeps forceMount panels mounted but hidden", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Body A</TabsContent>
        <TabsContent value="b" forceMount>
          Body B
        </TabsContent>
      </Tabs>,
    );
    const hiddenPanel = screen.getByText("Body B");
    expect(hiddenPanel).toBeInTheDocument();
    expect(hiddenPanel).not.toBeVisible();
  });
});
