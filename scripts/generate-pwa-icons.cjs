#!/usr/bin/env node
const { existsSync, mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico");

const root = process.cwd();
const srcSvg = path.join(root, "public/icons/pwa/purple-haze-app.svg");
const outDir = path.join(root, "public/icons/pwa");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

async function render(svgPath, pngPath, size) {
  await sharp(svgPath)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFormat("png")
    .toFile(pngPath);
}

async function convert() {
  console.log("Generating PWA icons from", srcSvg);
  const png192 = path.join(outDir, "purple-haze-192.png");
  const png512 = path.join(outDir, "purple-haze-512.png");
  const png48 = path.join(outDir, "favicon-48.png");
  const png32 = path.join(outDir, "favicon-32.png");
  const png16 = path.join(outDir, "favicon-16.png");

  await render(srcSvg, png192, 192);
  await render(srcSvg, png512, 512);
  await render(srcSvg, png48, 48);
  await render(srcSvg, png32, 32);
  await render(srcSvg, png16, 16);

  const ico = await pngToIco([png16, png32, png48]);
  const icoOut = path.join(root, "public/favicon.ico");
  writeFileSync(icoOut, ico);
  console.log("✓ Icons generated");
}

convert().catch((e) => {
  console.error(e);
  process.exit(1);
});
