import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading, Text, textVariants } from "./text";

describe("Text", () => {
  it("renders a <p> with the body scale by default", () => {
    render(<Text>Hello</Text>);
    const el = screen.getByText("Hello");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("text-body", "font-sans", "font-normal");
    expect(el).toHaveAttribute("data-slot", "text");
  });

  it("changes the tag with `as` but keeps the chosen size", () => {
    render(
      <Text as="span" variant="h4">
        Title
      </Text>,
    );
    const el = screen.getByText("Title");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("text-h4", "font-display");
  });

  it("applies tone, weight and align", () => {
    render(
      <Text tone="muted" weight="bold" align="center">
        Meta
      </Text>,
    );
    expect(screen.getByText("Meta")).toHaveClass("text-muted", "font-bold", "text-center");
  });

  it("`weight` wins over the variant's default weight", () => {
    render(
      <Text variant="h1" weight="normal">
        Light headline
      </Text>,
    );
    const el = screen.getByText("Light headline");
    expect(el).toHaveClass("font-normal");
    expect(el).not.toHaveClass("font-bold");
  });

  it("truncates to one line on request", () => {
    render(<Text truncate>Long text</Text>);
    expect(screen.getByText("Long text")).toHaveClass("truncate");
  });

  it("clamps to N lines via inline style", () => {
    render(<Text lineClamp={2}>Product name that is quite long</Text>);
    expect(screen.getByText("Product name that is quite long")).toHaveStyle({
      "-webkit-line-clamp": "2",
      overflow: "hidden",
    });
  });

  it("renders the child element with `asChild`, merging classes", () => {
    render(
      <Text asChild variant="label">
        <a href="/deals">Deals</a>
      </Text>,
    );
    const link = screen.getByRole("link", { name: "Deals" });
    expect(link).toHaveClass("text-label");
    expect(link).toHaveAttribute("href", "/deals");
  });

  it("merges className and forwards the ref", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Text ref={ref} className="mt-2">
        Ref
      </Text>,
    );
    expect(ref.current).toBe(screen.getByText("Ref"));
    expect(ref.current).toHaveClass("mt-2", "text-body");
  });

  it("exposes the same styles through `textVariants`", () => {
    expect(textVariants({ variant: "price" })).toContain("tabular-nums");
    expect(textVariants({ variant: "overline" })).toContain("uppercase");
  });
});

describe("Heading", () => {
  it("defaults to <h2> with the h2 scale", () => {
    render(<Heading>Section</Heading>);
    const el = screen.getByRole("heading", { level: 2, name: "Section" });
    expect(el).toHaveClass("text-h2", "font-display");
  });

  it("`level` sets both the tag and the matching size", () => {
    render(<Heading level={4}>Card title</Heading>);
    const el = screen.getByRole("heading", { level: 4, name: "Card title" });
    expect(el.tagName).toBe("H4");
    expect(el).toHaveClass("text-h4");
  });

  it("detaches the look from the level with `variant`", () => {
    render(
      <Heading level={2} variant="h5">
        Small but semantic
      </Heading>,
    );
    const el = screen.getByRole("heading", { level: 2 });
    expect(el.tagName).toBe("H2");
    expect(el).toHaveClass("text-h5");
    expect(el).not.toHaveClass("text-h2");
  });

  it("forwards the ref to the heading node", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading ref={ref} level={3}>
        Ref
      </Heading>,
    );
    expect(ref.current?.tagName).toBe("H3");
  });
});
