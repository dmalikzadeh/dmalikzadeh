// Generates toolkit.svg from the icons in icons/.
// Run: node scripts/build-toolkit.mjs

import { readFile, writeFile } from "node:fs/promises";

const ICON_DIR = new URL("../icons/", import.meta.url);
const OUT = new URL("../toolkit.svg", import.meta.url);

const GRID = [
  ". X X . X X .",
  "X X X X X X X",
  "X X X X X X X",
  ". X X X X X .",
  ". . X X X . .",
  ". . . X . . .",
];

const ORDER = [
  "vue",
  "python",
  "javascript",
  "threejs",
  "haskell",
  "docker",
  "react",
  "typescript",
  "nextjs",
  "azure",
  "stripe",
  "csharp",
  "github",
  "nodejs",
  "tailwind",
  "postgresql",
  "git",
  "cloudinary",
  "supabase",
  "figma",
  "vercel",
  "github-actions",
  "gsap",
  "headless-ui",
  "authjs",
  "resend",
  "postman",
];

const LABELS = {
  authjs: "Auth.js",
  azure: "Azure",
  cloudinary: "Cloudinary",
  csharp: "C#",
  docker: "Docker",
  figma: "Figma",
  git: "Git",
  "github-actions": "GitHub Actions",
  github: "GitHub",
  gsap: "GSAP",
  haskell: "Haskell",
  "headless-ui": "Headless UI",
  javascript: "JavaScript",
  nextjs: "Next.js",
  nodejs: "Node.js",
  postgresql: "PostgreSQL",
  postman: "Postman",
  python: "Python",
  react: "React",
  resend: "Resend",
  stripe: "Stripe",
  supabase: "Supabase",
  tailwind: "Tailwind CSS",
  threejs: "Three.js",
  typescript: "TypeScript",
  vercel: "Vercel",
  vue: "Vue",
};

const CELL = 54;
const ICON = 46;
const PAD = 10;

const cells = [];
GRID.forEach((row, r) => {
  row.split(/\s+/).forEach((c, x) => {
    if (c === "X") cells.push({ r, x });
  });
});

if (cells.length !== ORDER.length) {
  throw new Error(
    `grid has ${cells.length} cells but ORDER has ${ORDER.length}`,
  );
}

const COLS = GRID[0].split(/\s+/).length;
const W = COLS * CELL + PAD * 2;
const H = GRID.length * CELL + PAD * 2;

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function namespaceIds(svg, prefix) {
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  let out = svg;
  for (const id of ids) {
    const safe = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\sid="${safe}"`, "g"), ` id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${safe}\\)`, "g"), `url(#${prefix}${id})`)
      .replace(
        new RegExp(`(xlink:)?href="#${safe}"`, "g"),
        `href="#${prefix}${id}"`,
      );
  }
  return out;
}

function parseSvg(src, prefix) {
  const open = /<svg\b[^>]*>/i.exec(src);
  if (!open) throw new Error("no <svg> element");

  const inner = src
    .slice(open.index + open[0].length, src.lastIndexOf("</svg>"))
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  let w;
  let h;
  const vb = /viewBox="([\d.\-+eE\s,]+)"/i.exec(open[0]);
  if (vb) {
    const p = vb[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    [w, h] = [p[2], p[3]];
  } else {
    w = parseFloat(/width="([\d.]+)/i.exec(open[0])?.[1] ?? "24");
    h = parseFloat(/height="([\d.]+)/i.exec(open[0])?.[1] ?? "24");
  }
  if (!w || !h) [w, h] = [24, 24];

  return { inner: namespaceIds(inner, prefix), w, h };
}

const nodes = [];

for (const [i, cell] of cells.entries()) {
  const slug = ORDER[i];
  const cx = PAD + cell.x * CELL + CELL / 2;
  const cy = PAD + cell.r * CELL + CELL / 2;

  const src = await readFile(new URL(`${slug}.svg`, ICON_DIR), "utf8");
  const { inner, w, h } = parseSvg(src, `${slug}-`);
  const s = ICON / Math.max(w, h);

  nodes.push(
    `  <g transform="translate(${(cx - (w * s) / 2).toFixed(2)} ${(cy - (h * s) / 2).toFixed(2)}) scale(${s.toFixed(5)})">` +
      `<title>${esc(LABELS[slug] ?? slug)}</title>${inner}</g>`,
  );
}

const label = ORDER.map((s) => LABELS[s] ?? s).join(", ");

await writeFile(
  OUT,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Toolkit: ${esc(label)}">
${nodes.join("\n")}
</svg>
`,
  "utf8",
);

console.log(`toolkit.svg — ${W}x${H}, ${cells.length} icons`);
