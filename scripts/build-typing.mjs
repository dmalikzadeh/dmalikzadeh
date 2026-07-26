// Generates the animated typewriter text.
// Run: node scripts/build-typing.mjs

import { writeFile } from "node:fs/promises";

const OUT = new URL("../typing.svg", import.meta.url);

const LINES = [
  "I design and ship full-stack products",
  "Aicademy: my final-year project, now live",
  "Open to graduate Software Engineer roles",
];

const W = 620;
const H = 34;
const SIZE = 24;
const ADV = SIZE * 0.6;
const BASELINE = 22;
const COLOUR = "#F27554";
const CARET_W = 2;

const SLOT = 4.2;
const TOTAL = +(SLOT * LINES.length).toFixed(2);

const TYPE_END = 0.3;
const HOLD_END = 0.72;
const ERASE_END = 0.92;

const esc = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const pct = (v) => `${+(v * 100).toFixed(3)}%`;

const lines = LINES.map((text, i) => {
  const n = text.length;
  const w = n * ADV;
  const x = (W - w) / 2;
  const slot = 1 / LINES.length;
  const s = i * slot;

  return {
    i,
    text,
    n,
    w,
    x,
    at: {
      start: s,
      type: s + TYPE_END * slot,
      hold: s + HOLD_END * slot,
      erase: s + ERASE_END * slot,
    },
  };
});

const revealKeyframes = lines
  .map(
    ({ i, n, at }) => `    @keyframes reveal${i} {
      0% { transform: scaleX(0); animation-timing-function: step-end; }
      ${pct(at.start)} { transform: scaleX(0); animation-timing-function: steps(${n}, end); }
      ${pct(at.type)} { transform: scaleX(1); animation-timing-function: step-end; }
      ${pct(at.hold)} { transform: scaleX(1); animation-timing-function: steps(${n}, end); }
      ${pct(at.erase)} { transform: scaleX(0); }
      100% { transform: scaleX(0); }
    }`,
  )
  .join("\n");

const caretKeyframes = lines
  .map(
    ({ i, n, w, at }) => `    @keyframes caret${i} {
      0% { opacity: 0; transform: translateX(0); animation-timing-function: step-end; }
      ${pct(at.start)} { opacity: 1; transform: translateX(0); animation-timing-function: steps(${n}, end); }
      ${pct(at.type)} { opacity: 1; transform: translateX(${w}px); animation-timing-function: step-end; }
      ${pct(at.hold)} { opacity: 1; transform: translateX(${w}px); animation-timing-function: steps(${n}, end); }
      ${pct(at.erase)} { opacity: 1; transform: translateX(0); animation-timing-function: step-end; }
      ${pct(at.erase + 0.0001)} { opacity: 0; }
      100% { opacity: 0; }
    }`,
  )
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(LINES.join(". "))}">
  <defs>
${lines
  .map(
    ({ i, x, w }) => `    <clipPath id="clip${i}">
      <rect class="rev rev${i}" x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${H}"/>
    </clipPath>`,
  )
  .join("\n")}
  </defs>

  <style>
    .t {
      font: 500 ${SIZE}px ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      fill: ${COLOUR};
    }
    .rev { transform-box: fill-box; transform-origin: left center; }
    .rev0 { transform: scaleX(1); }
${lines
  .slice(1)
  .map(({ i }) => `    .rev${i} { transform: scaleX(0); }`)
  .join("\n")}
    .caret { fill: ${COLOUR}; transform-box: fill-box; }
    .caret0 { opacity: 1; transform: translateX(${lines[0].w.toFixed(2)}px); }
${lines
  .slice(1)
  .map(({ i }) => `    .caret${i} { opacity: 0; }`)
  .join("\n")}

${lines
  .map(
    ({ i }) =>
      `    .rev${i}   { animation: reveal${i} ${TOTAL}s infinite; }\n    .caret${i} { animation: caret${i} ${TOTAL}s infinite; }`,
  )
  .join("\n")}

${revealKeyframes}
${caretKeyframes}

    @media (prefers-reduced-motion: reduce) {
      .rev, .caret { animation: none !important; }
    }
  </style>

${lines
  .map(
    ({ i, x, w, n, text }) => `  <g clip-path="url(#clip${i})">
    <text class="t" x="${x.toFixed(2)}" y="${BASELINE}" textLength="${w.toFixed(2)}" lengthAdjust="spacing">${esc(text)}</text>
  </g>
  <rect class="caret caret${i}" x="${x.toFixed(2)}" y="${(BASELINE - SIZE + 2).toFixed(2)}" width="${CARET_W}" height="${(SIZE + 2).toFixed(2)}"/>`,
  )
  .join("\n")}
</svg>
`;

await writeFile(OUT, svg, "utf8");
console.log(
  `typing.svg written — ${LINES.length} lines, ${TOTAL}s loop:\n` +
    LINES.map((l) => `  · ${l}`).join("\n"),
);
