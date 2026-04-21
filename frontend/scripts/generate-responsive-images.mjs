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
  const variants = [220, 440];

  for (const width of variants) {
    const baseName = `screen-${width}`;
    const resized = sharp(sourcePath).resize({ width, fit: "inside", withoutEnlargement: true });

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
