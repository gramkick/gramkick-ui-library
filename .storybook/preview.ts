import type { Preview } from "@storybook/react-vite";
import "../src/styles/entry.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    backgrounds: {
      default: "canvas",
      values: [
        { name: "canvas", value: "#ffffff" },
        { name: "mint", value: "#eff8f0" },
        { name: "ink", value: "#10233a" },
      ],
    },
    layout: "centered",
  },
};

export default preview;
