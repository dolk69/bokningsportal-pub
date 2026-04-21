import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const imageDir = path.join(frontendRoot, "img");

async function generate() {
  await mkdir(imageDir, { recursive: true });
  const sourcePath = path.join(imageDir, "screen.png");
  const variants = [
    { width: 500, height: 350 },
    { width: 1000, height: 700 },
  ];

  for (const { width, height } of variants) {
    const baseName = `screen-${width}`;
    const resized = sharp(sourcePath).resize({
      width,
      height,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      withoutEnlargement: true,
    });

    await resized
      .clone()
      .webp({ quality: 70, effort: 6 })
      .toFile(path.join(imageDir, `${baseName}.webp`));

    await resized
      .clone()
      .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
      .toFile(path.join(imageDir, `${baseName}.png`));
  }
}

generate().catch((error) => {
  console.error("Kunde inte generera responsiva bilder:", error);
  process.exit(1);
});
