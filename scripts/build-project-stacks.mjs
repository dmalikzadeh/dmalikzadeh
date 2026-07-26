// Generates the project technology pills.
// Run: node scripts/build-project-stacks.mjs

import { writeFile } from "node:fs/promises";

const OUT = new URL("../projects/", import.meta.url);
const STACKS = {
  aicademy: ["Next.js", "TypeScript", "PostgreSQL", "Azure OpenAI"],
  "interview-bot": ["Next.js", "TypeScript", "Azure OpenAI", "Azure Speech"],
  motorarc: ["Next.js", "TypeScript", "PostgreSQL", "Cloudinary", "Puppeteer"],
  "landing-page": ["Next.js", "Tailwind", "GSAP", "Lenis", "WebGL"],
};

const esc = (value) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

const render = (labels) => {
  const gap = 8;
  const widths = labels.map((label) => Math.ceil(label.length * 6.9 + 24));
  const width =
    widths.reduce((sum, item) => sum + item, 0) + gap * (labels.length - 1);
  let x = 0;

  const pills = labels.map((label, index) => {
    const pillWidth = widths[index];
    const pill = `  <g transform="translate(${x})">
    <rect width="${pillWidth}" height="28" rx="14" class="pill"/>
    <text x="${pillWidth / 2}" y="17.5" text-anchor="middle" class="label">${esc(label)}</text>
  </g>`;
    x += pillWidth + gap;
    return pill;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 28" width="${width}" height="28" role="img" aria-label="${esc(labels.join(", "))}">
  <style>
    .pill { fill: #FFF0EA; stroke: #F4D4CA; }
    .label { fill: #9A4C35; font: 500 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace; }
    @media (prefers-color-scheme: dark) {
      .pill { fill: #21262D; stroke: #3D444D; }
      .label { fill: #F4A08A; }
    }
  </style>
${pills.join("\n")}
</svg>
`;
};

await Promise.all(
  Object.entries(STACKS).map(([name, labels]) =>
    writeFile(new URL(`stack-${name}.svg`, OUT), render(labels), "utf8"),
  ),
);

console.log(`project stacks — ${Object.keys(STACKS).length}`);
