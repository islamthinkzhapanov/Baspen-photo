import sharp from "sharp";

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  opacity?: number; // 0.0 - 1.0, default 0.25
  logoUrl?: string;
}

/**
 * Generate a watermarked version of the image.
 *
 * Supports two modes:
 * 1. Text watermark (diagonal repeating pattern) — default
 * 2. Logo watermark (centered semi-transparent logo overlay)
 *
 * The watermarked image is resized to max 1200px (preview size).
 */
export async function generateWatermarkedImage(
  imageBuffer: Buffer,
  config: WatermarkConfig = { enabled: true }
): Promise<Buffer> {
  if (!config.enabled) {
    // Just resize without watermark
    return sharp(imageBuffer)
      .resize(1200, undefined, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  const resizedBuffer = await sharp(imageBuffer)
    .resize(1200, undefined, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const meta = await sharp(resizedBuffer).metadata();
  const w = meta.width || 1200;
  const h = meta.height || 900;
  const opacity = config.opacity ?? 0.5;
  const text = config.text || "BASPEN";

  const fontSize = Math.max(24, Math.floor(w / 14));
  const fillOpacity = opacity;
  const strokeOpacity = Math.min(fillOpacity * 0.6, 0.3);
  const patternW = fontSize * 6;
  const patternH = fontSize * 3;
  const escapedText = escapeXml(text);

  const svgWatermark = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark" patternUnits="userSpaceOnUse"
          width="${patternW}" height="${patternH}"
          patternTransform="rotate(-30)">
          <text x="0" y="${fontSize}"
            font-family="sans-serif" font-size="${fontSize}" font-weight="bold"
            fill="rgba(255,255,255,${fillOpacity})"
            stroke="rgba(0,0,0,${strokeOpacity})" stroke-width="3">${escapedText}</text>
          <text x="${patternW / 2}" y="${fontSize * 2}"
            font-family="sans-serif" font-size="${fontSize}" font-weight="bold"
            fill="rgba(255,255,255,${fillOpacity})"
            stroke="rgba(0,0,0,${strokeOpacity})" stroke-width="3">${escapedText}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)" />
    </svg>
  `);

  return sharp(resizedBuffer)
    .composite([{ input: svgWatermark, top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
