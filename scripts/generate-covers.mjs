import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = new URL("../", import.meta.url).pathname;

const covers = [
  {
    path: "assets/images/DISTRIB/DISTRIB-01/cover.svg",
    eyebrow: "DISTRIBUTED SYSTEMS",
    title: ["Load balancing", "from scratch"],
    accent: "#ff705d",
    motif: "network",
  },
  { path: "assets/images/DISTRIB/DISTRIB-02/cover.svg", eyebrow: "AZURE NETWORKING", title: ["Azure VPN", "Gateway"], accent: "#62cbc9", motif: "gateway" },
  { path: "assets/images/JEKYLL/JEKYLL-01/cover.svg", eyebrow: "JEKYLL", title: ["Feedback via", "GitHub Issues"], accent: "#f9cc55", motif: "feedback" },
  { path: "assets/images/JEKYLL/JEKYLL-02/cover.svg", eyebrow: "JEKYLL", title: ["A series of", "articles"], accent: "#ff705d", motif: "series" },
  { path: "assets/images/LLM/LLM-02/cover.svg", eyebrow: "LLM ENGINEERING", title: ["LLM-friendly", "codebases"], accent: "#62cbc9", motif: "code" },
  { path: "assets/images/REDIS/REDIS-01/cover.svg", eyebrow: "REDIS", title: ["Introduction", "to Redis"], accent: "#ff705d", motif: "database" },
  { path: "assets/images/REDIS/REDIS-02/cover.svg", eyebrow: "REDIS", title: ["Redis inside", "Docker"], accent: "#62cbc9", motif: "container" },
  { path: "assets/images/REDIS/REDIS-03/cover.svg", eyebrow: "REDIS", title: ["Using the", "Redis CLI"], accent: "#f9cc55", motif: "terminal" },
  { path: "assets/images/REDIS/REDIS-04/cover.svg", eyebrow: "REDIS", title: ["Metrics with", "INFO"], accent: "#62cbc9", motif: "metrics" },
  { path: "assets/images/REDIS/REDIS-05/cover.svg", eyebrow: "REDIS + GRAFANA", title: ["Redis meets", "Grafana"], accent: "#ff705d", motif: "dashboard" },
  { path: "assets/images/STARTRIGHT/STARTRIGHT-01/cover.svg", eyebrow: "START RIGHT", title: ["The what, why", "and how of nonce"], accent: "#f9cc55", motif: "key" },
  { path: "assets/images/STARTRIGHT/STARTRIGHT-02/cover.svg", eyebrow: "START RIGHT", title: ["Content Security", "Policy"], accent: "#62cbc9", motif: "shield" },
  { path: "assets/images/STARTRIGHT/linters/cover.svg", eyebrow: "FRONTEND FOUNDATIONS", title: ["Add", "linters"], accent: "#f9cc55", motif: "lint" },
  { path: "assets/images/STARTRIGHT/tests/cover.svg", eyebrow: "FRONTEND FOUNDATIONS", title: ["Add", "tests"], accent: "#62cbc9", motif: "tests" },
  { path: "assets/images/STARTRIGHT/bundles/cover.svg", eyebrow: "FRONTEND FOUNDATIONS", title: ["Track", "bundles"], accent: "#ff705d", motif: "bundle" },
  { path: "assets/images/STARTRIGHT/telemetry/cover.svg", eyebrow: "FRONTEND FOUNDATIONS", title: ["Unify", "telemetry"], accent: "#62cbc9", motif: "telemetry" },
  { path: "assets/images/STARTRIGHT/components/cover.svg", eyebrow: "FRONTEND FOUNDATIONS", title: ["Use", "components"], accent: "#f9cc55", motif: "components" },
  { path: "assets/images/STARTRIGHT/types/cover.svg", eyebrow: "FRONTEND FOUNDATIONS", title: ["Use strong", "types"], accent: "#ff705d", motif: "types" },
  { path: "assets/images/WEB/WEB-01/cover.svg", eyebrow: "WEB COMPONENTS", title: ["Building with", "FAST Element"], accent: "#62cbc9", motif: "browser" },
  { path: "assets/images/WEB/WEB-02/cover.svg", eyebrow: "THE WEB", title: ["Internet", "duct tape"], accent: "#f9cc55", motif: "protocol" },
];

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function motif(name, accent) {
  if (name === "network") {
    return `
      <path d="M790 194H930M860 194V310M860 310H760M860 310H960" fill="none" stroke="#191817" stroke-width="12"/>
      <circle cx="760" cy="310" r="54" fill="#f4f0e8" stroke="#191817" stroke-width="10"/>
      <circle cx="960" cy="310" r="54" fill="#f4f0e8" stroke="#191817" stroke-width="10"/>
      <rect x="790" y="126" width="140" height="136" fill="${accent}" stroke="#191817" stroke-width="10"/>
      <path d="M818 158h84M818 190h84M818 222h52" stroke="#191817" stroke-width="10"/>
      <circle cx="760" cy="310" r="13" fill="${accent}"/>
      <circle cx="960" cy="310" r="13" fill="${accent}"/>
    `;
  }

  const icons = {
    gateway: `<path d="M746 330h238c56 0 72-77 20-98 3-61-76-91-116-45-35-42-101-18-100 36-58 0-64 107-42 107Z" fill="${accent}" stroke="#191817" stroke-width="10"/><path d="M786 386h158M814 356l-32 30 32 30M916 356l32 30-32 30" fill="none" stroke="#191817" stroke-width="10"/>`,
    feedback: `<path d="M740 150h290v210H874l-80 66 18-66h-72Z" fill="${accent}" stroke="#191817" stroke-width="10"/><circle cx="810" cy="255" r="13"/><circle cx="885" cy="255" r="13"/><circle cx="960" cy="255" r="13"/>`,
    series: `<rect x="772" y="134" width="260" height="290" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><rect x="742" y="164" width="260" height="290" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><rect x="712" y="194" width="260" height="290" fill="${accent}" stroke="#191817" stroke-width="10"/><path d="M758 258h168M758 302h168M758 346h112" stroke="#191817" stroke-width="10"/>`,
    code: `<rect x="716" y="142" width="326" height="286" fill="#191817" stroke="#191817" stroke-width="10"/><circle cx="752" cy="178" r="10" fill="#ff705d"/><circle cx="784" cy="178" r="10" fill="#f9cc55"/><circle cx="816" cy="178" r="10" fill="${accent}"/><path d="m790 258-48 46 48 46M920 258l48 46-48 46M884 235l-58 138" fill="none" stroke="#f4f0e8" stroke-width="12"/>`,
    database: `<ellipse cx="870" cy="176" rx="142" ry="54" fill="${accent}" stroke="#191817" stroke-width="10"/><path d="M728 176v190c0 72 284 72 284 0V176M728 270c0 72 284 72 284 0" fill="${accent}" stroke="#191817" stroke-width="10"/>`,
    container: `<path d="m870 132 150 82v170l-150 82-150-82V214Z" fill="${accent}" stroke="#191817" stroke-width="10"/><path d="m720 214 150 82 150-82M870 296v170M790 176l150 82" fill="none" stroke="#191817" stroke-width="10"/>`,
    terminal: `<rect x="708" y="144" width="324" height="280" fill="#191817" stroke="#191817" stroke-width="10"/><path d="m754 234 52 48-52 48M836 330h124" fill="none" stroke="${accent}" stroke-width="13"/>`,
    metrics: `<path d="M728 420V154M728 420h304" fill="none" stroke="#191817" stroke-width="10"/><path d="m758 360 62-70 58 36 88-118 50 42" fill="none" stroke="${accent}" stroke-width="16"/><circle cx="820" cy="290" r="12"/><circle cx="878" cy="326" r="12"/><circle cx="966" cy="208" r="12"/>`,
    dashboard: `<circle cx="870" cy="286" r="150" fill="${accent}" stroke="#191817" stroke-width="10"/><path d="M760 344a120 120 0 0 1 220 0M870 286l74-72" fill="none" stroke="#191817" stroke-width="12"/><circle cx="870" cy="286" r="18" fill="#f4f0e8" stroke="#191817" stroke-width="8"/>`,
    key: `<circle cx="802" cy="250" r="82" fill="${accent}" stroke="#191817" stroke-width="12"/><circle cx="802" cy="250" r="26" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><path d="m860 308 150 150M930 378l42-42M970 418l42-42" stroke="#191817" stroke-width="18"/>`,
    shield: `<path d="M870 124 1018 180v112c0 92-62 154-148 190-86-36-148-98-148-190V180Z" fill="${accent}" stroke="#191817" stroke-width="11"/><path d="m798 292 48 48 104-112" fill="none" stroke="#191817" stroke-width="16"/>`,
    lint: `<rect x="724" y="136" width="292" height="326" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><path d="m766 218 22 22 42-48M766 300l22 22 42-48M766 382l22 22 42-48M858 222h112M858 304h112M858 386h112" fill="none" stroke="${accent}" stroke-width="12"/>`,
    tests: `<path d="M822 132h96M846 132v110l-104 178c-20 34 6 70 46 70h164c40 0 66-36 46-70L894 242V132" fill="#f4f0e8" stroke="#191817" stroke-width="11"/><path d="M782 386h176l40 68c10 18-2 36-24 36H766c-22 0-34-18-24-36Z" fill="${accent}"/><circle cx="850" cy="422" r="13"/><circle cx="912" cy="450" r="10"/>`,
    bundle: `<path d="m870 124 136 70-136 70-136-70Z" fill="${accent}" stroke="#191817" stroke-width="10"/><path d="m734 194v174l136 76 136-76V194M870 264v180" fill="none" stroke="#191817" stroke-width="10"/><path d="m734 280 136 72 136-72" fill="none" stroke="#191817" stroke-width="8"/>`,
    telemetry: `<path d="M704 310h94l34-92 66 190 44-98h104" fill="none" stroke="#191817" stroke-width="14"/><circle cx="832" cy="218" r="14" fill="${accent}"/><circle cx="898" cy="408" r="14" fill="${accent}"/><circle cx="942" cy="310" r="14" fill="${accent}"/>`,
    components: `<rect x="714" y="142" width="138" height="138" fill="${accent}" stroke="#191817" stroke-width="10"/><rect x="888" y="142" width="138" height="138" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><rect x="714" y="316" width="138" height="138" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><rect x="888" y="316" width="138" height="138" fill="${accent}" stroke="#191817" stroke-width="10"/>`,
    types: `<text x="690" y="360" fill="#191817" font-family="Arial, Helvetica, sans-serif" font-size="230" font-weight="700">{ }</text><text x="845" y="305" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="700">T</text>`,
    browser: `<rect x="704" y="136" width="340" height="292" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><path d="M704 198h340" stroke="#191817" stroke-width="10"/><circle cx="738" cy="168" r="10" fill="#ff705d"/><circle cx="772" cy="168" r="10" fill="#f9cc55"/><circle cx="806" cy="168" r="10" fill="${accent}"/><path d="m792 264-48 44 48 44M956 264l48 44-48 44M914 242l-76 132" fill="none" stroke="#191817" stroke-width="12"/>`,
    protocol: `<path d="M730 184h280M730 404h280" stroke="#191817" stroke-width="28"/><path d="m820 150 100 288" stroke="${accent}" stroke-width="76"/><path d="m820 150 100 288" stroke="#191817" stroke-width="10" stroke-dasharray="18 14"/><circle cx="730" cy="184" r="30" fill="#f4f0e8" stroke="#191817" stroke-width="10"/><circle cx="1010" cy="404" r="30" fill="#f4f0e8" stroke="#191817" stroke-width="10"/>`,
  };

  if (icons[name]) {
    return icons[name];
  }

  throw new Error(`Unknown motif: ${name}`);
}

function renderCover(cover) {
  const title = cover.title
    .map((line, index) => `<tspan x="84" dy="${index === 0 ? 0 : 82}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(cover.title.join(" "))}</title>
  <desc id="desc">Editorial cover illustration for ${escapeXml(cover.title.join(" "))}</desc>
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="#ddd7cd" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#f4f0e8"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#191817" stroke-width="8"/>
  <rect x="84" y="88" width="290" height="38" fill="${cover.accent}"/>
  <text x="100" y="115" fill="#191817" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="2">${escapeXml(cover.eyebrow)}</text>
  <text x="84" y="242" fill="#191817" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700" letter-spacing="0">${title}</text>
  <path d="M84 500h540" stroke="#191817" stroke-width="8"/>
  <circle cx="104" cy="540" r="12" fill="${cover.accent}" stroke="#191817" stroke-width="5"/>
  <path d="M136 540h190" stroke="#191817" stroke-width="6"/>
  <g transform="translate(200 20) scale(0.9)">
    ${motif(cover.motif, cover.accent)}
  </g>
</svg>\n`;
}

for (const cover of covers) {
  const outputPath = join(root, cover.path);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderCover(cover));
}

console.log(`Generated ${covers.length} covers.`);