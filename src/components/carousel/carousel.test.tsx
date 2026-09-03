import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Carousel } from "./carousel";

// jsdom has no layout engine, so scroll methods are no-op stubs we can spy on.
beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Carousel", () => {
  it("renders one group per child with a live region", () => {
    render(
      <Carousel aria-label="Product images">
        <div>Slide A</div>
        <div>Slide B</div>
        <div>Slide C</div>
      </Carousel>,
    );
    expect(screen.getByRole("region", { name: "Product images" })).toBeInTheDocument();
    // aria-hidden is set on off-screen slides, so query including hidden nodes.
    expect(screen.getAllByRole("group", { hidden: true })).toHaveLength(3);
    expect(screen.getByText("Slide A")).toBeInTheDocument();
    expect(screen.getByText("Slide 1 of 3")).toBeInTheDocument();
  });

  it("renders nothing when it has no slides", () => {
    const { container } = render(<Carousel>{null}</Carousel>);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides arrows and dots for a single slide", () => {
    render(
      <Carousel>
        <div>Only slide</div>
      </Carousel>,
    );
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows a dot per page and disables the prev arrow at the start", () => {
    render(
      <Carousel>
        <div>A</div>
        <div>B</div>
      </Carousel>,
    );
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("scrolls the viewport when a dot is clicked", async () => {
    render(
      <Carousel>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Carousel>,
    );
    await userEvent.click(screen.getByRole("tab", { name: "Go to page 3" }));
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
  });

  it("advances on ArrowRight from the focused viewport", async () => {
    render(
      <Carousel aria-label="Gallery">
        <div>A</div>
        <div>B</div>
      </Carousel>,
    );
    const viewport = screen.getByRole("region", { name: "Gallery" });
    viewport.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(Element.prototype.scrollTo).toHaveBeenCalled();
  });

  it("caps the dots to a sliding window when there are many pages", () => {
    render(
      <Carousel aria-label="Many">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i}>Slide {i}</div>
        ))}
      </Carousel>,
    );
    // 14 pages but the window shows at most 7 dots.
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(screen.getByRole("tab", { name: "Go to page 1" })).toBeInTheDocument();
  });

  it("renders a thumbnail strip instead of dots when thumbnails are given", () => {
    render(
      <Carousel thumbnails={["a.jpg", "b.jpg", "c.jpg"]} aria-label="Gallery">
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Carousel>,
    );
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    const thumbs = screen.getAllByRole("button", { name: /^Go to slide \d$/ });
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    expect(thumbs[1]).not.toHaveAttribute("aria-current");
  });

  it("clicking a thumbnail scrolls the viewport", async () => {
    render(
      <Carousel thumbnails={["a.jpg", "b.jpg"]} aria-label="Gallery">
        <div>A</div>
        <div>B</div>
      </Carousel>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 2" }));
    expect(Element.prototype.scrollTo).toHaveBeenCalled();
  });

  it("pages by view when slidesPerView > 1 (one dot per page, wider slide basis)", () => {
    render(
      <Carousel slidesPerView={2} gap={16} aria-label="Card row">
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
        <div>5</div>
      </Carousel>,
    );
    // 5 slides, 2 per view -> 3 pages -> 3 dots.
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByText("Slides 1–2 of 5")).toBeInTheDocument();
    const firstSlide = screen.getAllByRole("group", { hidden: true })[0];
    expect(firstSlide).toHaveStyle({ flex: "0 0 calc((100% - 16px) / 2)" });
  });
});
