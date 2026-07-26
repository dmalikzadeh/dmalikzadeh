// Generates langs.svg from public GitHub language data.
// Run: GH_USER=dmalikzadeh GITHUB_TOKEN=... node scripts/build-langs.mjs

import { writeFile } from "node:fs/promises";

const USER = process.env.GH_USER ?? "dmalikzadeh";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = new URL("../langs.svg", import.meta.url);
const TOP_N = 6;
const LEFT_PAD = 52;
const CONTENT_W = 320;
const W = LEFT_PAD + CONTENT_W;
const H = 344;
const TITLE_Y = 18;
const TOP = 46;
const ROW_GAP = 48;
const BAR_W = 258;
const BAR_H = 4;

const C = {
  title: "#C4532F",
  titleDark: "#F27554",
  name: "#8D8078",
  nameLight: "#1F2328",
  nameDark: "#E6EDF3",
  pct: "#8D8078",
  pctLight: "#59636E",
  pctDark: "#8D96A0",
  track: "#8D8078",
};

const ANCHORS = ["#E8613C", "#F27554", "#F4978E", "#F8AD9D"];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const colourFor = (i, n) => {
  if (n <= 1) return ANCHORS[0];
  const p = (i / (n - 1)) * (ANCHORS.length - 1);
  const lo = Math.min(Math.floor(p), ANCHORS.length - 2);
  const t = p - lo;
  const [a, b] = [hex(ANCHORS[lo]), hex(ANCHORS[lo + 1])];
  return `#${a
    .map((v, k) =>
      Math.round(v + (b[k] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

const api = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `${USER}-profile-card`,
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok)
    throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function collect() {
  const totals = new Map();
  let page = 1;

  for (;;) {
    const repos = await api(
      `/users/${USER}/repos?per_page=100&page=${page}&type=owner&sort=pushed`,
    );
    if (repos.length === 0) break;

    for (const repo of repos) {
      if (repo.fork || repo.name === USER) continue;
      const langs = await api(`/repos/${USER}/${repo.name}/languages`);
      for (const [name, bytes] of Object.entries(langs)) {
        totals.set(name, (totals.get(name) ?? 0) + bytes);
      }
    }

    if (repos.length < 100) break;
    page += 1;
  }

  return totals;
}

function render(entries, total) {
  const n = entries.length;
  const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  const rows = entries.map(([name, bytes], i) => {
    const pct = (bytes / total) * 100;
    const y = TOP + i * ROW_GAP;
    const barY = y + 22;
    const fill = Math.max((pct / 100) * BAR_W, BAR_H);

    return `  <g>
    <text x="${LEFT_PAD}" y="${(y + 13).toFixed(1)}" class="nm">${esc(name)}</text>
    <rect x="${LEFT_PAD}" y="${barY.toFixed(1)}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}" class="tr"/>
    <rect x="${LEFT_PAD}" y="${barY.toFixed(1)}" width="${fill.toFixed(1)}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${colourFor(i, n)}"/>
    <text x="${W}" y="${(barY + BAR_H).toFixed(1)}" class="pc" text-anchor="end">${pct.toFixed(2)}%</text>
  </g>`;
  });

  const label = entries
    .map(([name, bytes]) => `${name} ${((bytes / total) * 100).toFixed(1)}%`)
    .join(", ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Most used languages: ${esc(label)}">
  <style>
    .ti { font: 700 11px ${FONT}; fill: ${C.title}; letter-spacing: 1.6px; }
    .nm { font: 500 12.5px ${FONT}; fill: ${C.name}; }
    .pc { font: 400 11.5px ${FONT}; fill: ${C.pct}; }
    .tr { fill: ${C.track}; fill-opacity: .28; }

    @media (prefers-color-scheme: light) {
      .nm { fill: ${C.nameLight}; }
      .pc { fill: ${C.pctLight}; }
    }
    @media (prefers-color-scheme: dark) {
      .ti { fill: ${C.titleDark}; }
      .nm { fill: ${C.nameDark}; }
      .pc { fill: ${C.pctDark}; }
      .tr { fill-opacity: .22; }
    }
  </style>

  <text x="${LEFT_PAD}" y="${TITLE_Y}" class="ti">MOST USED LANGUAGES</text>
${rows.join("\n")}
</svg>
`;
}

const totals = await collect();
if (totals.size === 0) throw new Error("no language data returned");

const all = [...totals.entries()].sort((a, b) => b[1] - a[1]);
const total = all.reduce((sum, [, bytes]) => sum + bytes, 0);
const sorted = all.slice(0, TOP_N);

await writeFile(OUT, render(sorted, total), "utf8");
console.log(
  `langs.svg — ${sorted.length} languages: ${sorted
    .map(([n, b]) => `${n} ${((b / total) * 100).toFixed(1)}%`)
    .join(", ")}`,
);
