import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label with the button role", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to type=button", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("type", "button");
  });

  it("shows a pointer cursor when enabled and not-allowed when disabled", () => {
    const { rerender } = render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("cursor-pointer");
    rerender(<Button disabled>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("disabled:cursor-not-allowed");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges consumer classNames over the variant classes", () => {
    render(<Button className="bg-brand-blue">Themed</Button>);
    const button = screen.getByRole("button", { name: "Themed" });
    expect(button).toHaveClass("bg-brand-blue");
    expect(button).not.toHaveClass("bg-leaf");
  });

  it("applies the leaf border + text for the outline-brand variant", () => {
    render(<Button variant="outline-brand">Add</Button>);
    const button = screen.getByRole("button", { name: "Add" });
    expect(button).toHaveClass("border-leaf", "text-leaf");
  });

  it("applies a danger border + text (no fill) for the outline-danger variant", () => {
    render(<Button variant="outline-danger">Log out</Button>);
    const button = screen.getByRole("button", { name: "Log out" });
    expect(button).toHaveClass("border", "border-danger", "text-danger", "bg-canvas");
    expect(button).not.toHaveClass("text-white");
  });

  it("accepts the label prop as an alternative to children", () => {
    render(<Button label="Save" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("prefers children over label when both are provided", () => {
    render(<Button label="Save">Publish</Button>);
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("renders the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/somewhere">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toHaveClass("inline-flex");
    expect(link).not.toHaveAttribute("type");
  });

  describe("icons", () => {
    it("renders leftIcon and rightIcon around the label", () => {
      render(
        <Button leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />}>
          Continue
        </Button>,
      );
      expect(screen.getByTestId("left")).toBeInTheDocument();
      expect(screen.getByTestId("right")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    });

    it("hides the icon wrappers from assistive tech", () => {
      const { container } = render(<Button leftIcon={<span data-testid="left" />}>Go</Button>);
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
      // the accessible name is still just the label
      expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
    });
  });

  describe("loading", () => {
    it("marks the button busy and disabled", () => {
      render(<Button loading>Save</Button>);
      const button = screen.getByRole("button", { name: "Save" });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toHaveAttribute("data-loading", "true");
    });

    it("blocks clicks while loading", async () => {
      const onClick = vi.fn();
      render(
        <Button loading onClick={onClick}>
          Save
        </Button>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("keeps the label mounted (stable width) and shows a spinner when no loadingText", () => {
      const { container } = render(<Button loading>Save changes</Button>);
      expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
      expect(screen.getByText("Save changes")).toBeInTheDocument();
    });

    it("shows loadingText instead of the label when provided", () => {
      render(
        <Button loading loadingText="Saving…">
          Save changes
        </Button>,
      );
      expect(screen.getByText("Saving…")).toBeInTheDocument();
      expect(screen.queryByText("Save changes")).not.toBeInTheDocument();
    });

    it("is not busy or disabled when loading is false", () => {
      render(<Button>Save</Button>);
      const button = screen.getByRole("button", { name: "Save" });
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute("aria-busy");
    });
  });
});
