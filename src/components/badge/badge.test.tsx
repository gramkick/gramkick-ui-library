import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge>Approved</Badge>);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("applies the requested variant classes", () => {
    render(<Badge variant="danger">Rejected</Badge>);
    expect(screen.getByText("Rejected")).toHaveClass("text-danger");
  });

  it("falls back to the neutral variant and md size", () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText("Draft")).toHaveClass("bg-mint", "text-xs");
  });

  it("applies the requested size classes", () => {
    render(<Badge size="lg">Big</Badge>);
    expect(screen.getByText("Big")).toHaveClass("text-sm", "px-3");
  });

  it("accepts the label prop as an alternative to children", () => {
    render(<Badge label="Approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("prefers children over label when both are provided", () => {
    render(<Badge label="Approved">Pending</Badge>);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
  });

  it("renders leftIcon and rightIcon around the label", () => {
    render(
      <Badge leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />}>
        GST
      </Badge>,
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
    expect(screen.getByText("GST")).toBeInTheDocument();
  });

  it("hides the icon wrappers from assistive tech", () => {
    render(<Badge leftIcon={<span data-testid="left" />}>Pending</Badge>);
    expect(screen.getByTestId("left").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});
