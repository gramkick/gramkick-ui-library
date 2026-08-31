import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

describe("Card", () => {
  it("composes its sections", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );
    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("forwards className onto the root", () => {
    render(<Card className="max-w-lg" data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("max-w-lg", "bg-surface");
  });

  it("defaults to the elevated variant with lg radius", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("shadow-card", "border", "rounded-gk-lg");
  });

  it("outline variant drops the shadow but keeps the border", () => {
    render(<Card variant="outline" data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("border", "shadow-none");
    expect(card).not.toHaveClass("shadow-card");
  });

  it("ghost variant drops both border and shadow", () => {
    render(<Card variant="ghost" data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("border-0", "shadow-none");
  });

  it("pairs a shadow with square corners (radius=none)", () => {
    render(<Card variant="raised" radius="none" data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("shadow-art", "rounded-none");
  });

  it("adds hover + focus affordances when interactive", () => {
    render(<Card interactive data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("cursor-pointer", "hover:shadow-art");
  });

  it("renders as the child element when asChild is set", () => {
    render(
      <Card asChild>
        <a href="/merchants/1">Open merchant</a>
      </Card>,
    );
    expect(screen.getByRole("link", { name: "Open merchant" })).toHaveClass("bg-surface");
  });
});
