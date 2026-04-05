import sharp from "sharp";

interface ShareFrameConfig {
  eventTitle: string;
  eventDate?: string;
  eventLogo?: string;
  sponsors?: Array<{ name: string; logoUrl: string }>;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
}

/**
 * Generate a branded share image with frame overlay.
 *
 * Layout:
 * ┌────────────────────────────┐
 * │     [Photo fills frame]     │
 * │                              │
 * │                              │
 * ├──────────────────────────────┤
 * │ Event Logo  EVENT TITLE      │
 * │ Date     [Sponsor] [Sponsor] │
 * └──────────────────────────────┘
 */
export async function generateShareFrame(
  imageBuffer: Buffer,
  config: ShareFrameConfig
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const imgW = meta.width || 1200;
  const imgH = meta.height || 900;

  // Frame dimensions
  const borderW = config.borderWidth ?? 3;
  const barHeight = 80;
  const totalW = imgW + borderW * 2;
  const totalH = imgH + borderW * 2 + barHeight;
  const bgColor = config.backgroundColor || "#FFFFFF";
  const borderColor = config.borderColor || "#005FF9";

  // Build bottom bar SVG
  const sponsorLogos = (config.sponsors || []).slice(0, 4);
  const sponsorWidth = sponsorLogos.length > 0 ? 160 : 0;
  const sponsorStartX = totalW - 20 - sponsorWidth;

  const escapedTitle = escapeXml(config.eventTitle);
  const escapedDate = config.eventDate ? escapeXml(config.eventDate) : "";

  const titleX = config.eventLogo ? 80 : 20;

  const bottomBarSvg = `
    <svg width="${totalW}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${totalW}" height="${barHeight}" fill="${bgColor}" />
      <text x="${titleX}" y="32" font-family="sans-serif" font-size="20" font-weight="bold" fill="#2C2D2E">
        ${escapedTitle}
      </text>
      ${
        escapedDate
          ? `<text x="${titleX}" y="56" font-family="sans-serif" font-size="14" fill="#6B7280">${escapedDate}</text>`
          : ""
      }
      ${
        sponsorLogos.length > 0
          ? `<text x="${sponsorStartX}" y="56" font-family="sans-serif" font-size="10" fill="#9CA3AF">Sponsors</text>`
          : ""
      }
    </svg>
  `;

  // Build the composite frame
  const composites: sharp.OverlayOptions[] = [];

  // Photo centered in frame
  composites.push({
    input: await sharp(imageBuffer)
      .resize(imgW, imgH, { fit: "cover" })
      .toBuffer(),
    top: borderW,
    left: borderW,
  });

  // Bottom bar
  composites.push({
    input: Buffer.from(bottomBarSvg),
    top: imgH + borderW * 2,
    left: 0,
  });

  // Event logo in bottom bar (if available)
  if (config.eventLogo) {
    try {
      const logoBuffer = await fetchImage(config.eventLogo);
      const resizedLogo = await sharp(logoBuffer)
        .resize(50, 50, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      composites.push({
        input: resizedLogo,
        top: imgH + borderW * 2 + 15,
        left: 16,
      });
    } catch {
      // Logo fetch failed, skip
    }
  }

  // Sponsor logos in bottom bar
  for (let i = 0; i < sponsorLogos.length; i++) {
    try {
      const logoBuffer = await fetchImage(sponsorLogos[i].logoUrl);
      const resizedLogo = await sharp(logoBuffer)
        .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      composites.push({
        input: resizedLogo,
        top: imgH + borderW * 2 + 12,
        left: sponsorStartX + i * 40,
      });
    } catch {
      // Skip failed sponsor logos
    }
  }

  // Create frame background with border
  const result = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: borderColor,
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
