// Copies the raw token stylesheet into dist so consumers can `@import
// "@gramkick/ui/theme.css"` and let their own Tailwind build pick up the tokens.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "src/styles/theme.css");
const to = resolve(root, "dist/theme.css");

mkdirSync(dirname(to), { recursive: true });
copyFileSync(from, to);
console.log(`copied ${from} -> ${to}`);
