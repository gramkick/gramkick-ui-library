import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel } from "./carousel";

const meta = {
  title: "Components/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  argTypes: {
    slidesPerView: { control: { type: "number", min: 1, max: 5 } },
    gap: { control: { type: "number", min: 0, max: 32 } },
    align: { control: "inline-radio", options: ["start", "center"] },
    showArrows: { control: "boolean" },
    showDots: { control: "boolean" },
    initialIndex: { control: "number" },
  },
  args: { slidesPerView: 1, gap: 0, showArrows: true, showDots: true, initialIndex: 0 },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const HUES = [140, 210, 30, 280, 190, 350, 90, 250, 15, 320, 170, 60];
const bg = (i: number) => `hsl(${HUES[i % HUES.length]} 70% 88%)`;
const swatch = (i: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${bg(i)}"/><text x="50%" y="55%" font-size="34" text-anchor="middle" fill="#10233a">${i + 1}</text></svg>`,
  )}`;

function slides(n: number, h = 220) {
  return Array.from({ length: n }, (_, i) => (
    <div
      key={i}
      className="flex items-center justify-center text-2xl font-bold text-ink"
      style={{ background: bg(i), height: h }}
    >
      Slide {i + 1}
    </div>
  ));
}

/** Full-bleed, one slide at a time — the mobile default. */
export const SingleView: Story = {
  render: (args) => (
    <div className="max-w-[360px]">
      <Carousel {...args} aria-label="Demo images" viewportClassName="rounded-gk-lg">
        {slides(5)}
      </Carousel>
    </div>
  ),
};

/** Many pages → the dots collapse to a sliding window of 7 (edge dots shrink). */
export const ManyPagesWindowedDots: Story = {
  render: (args) => (
    <div className="max-w-[360px]">
      <Carousel {...args} aria-label="Twelve slides" viewportClassName="rounded-gk-lg">
        {slides(12)}
      </Carousel>
    </div>
  ),
};

/** Thumbnail navigation — 10 images, but the strip is a compact ~4-thumb window
 *  that auto-scrolls to keep the active one centred. */
export const WithThumbnails: Story = {
  render: (args) => (
    <div className="max-w-[360px]">
      <Carousel
        {...args}
        aria-label="Product photos"
        viewportClassName="rounded-gk-lg"
        thumbnails={Array.from({ length: 10 }, (_, i) => swatch(i))}
      >
        {slides(10)}
      </Carousel>
    </div>
  ),
};

/** A desktop "row of cards" — `slidesPerView` + `gap`, paging a full view at a time. */
export const CardRow: Story = {
  args: { slidesPerView: 3, gap: 16 },
  render: (args) => (
    <div className="max-w-[720px]">
      <Carousel {...args} aria-label="Nearby stores">
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="flex h-[160px] items-center justify-center rounded-gk-md text-lg font-bold text-ink"
            style={{ background: bg(i) }}
          >
            Card {i + 1}
          </div>
        ))}
      </Carousel>
    </div>
  ),
};

export const SingleSlide: Story = {
  render: (args) => (
    <div className="max-w-[360px]">
      <Carousel {...args} aria-label="One image" viewportClassName="rounded-gk-lg">
        <div className="flex h-[220px] items-center justify-center bg-mint text-2xl font-bold text-ink">
          Only slide
        </div>
      </Carousel>
    </div>
  ),
};
