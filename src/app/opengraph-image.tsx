import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Colores de marca tomados de src/app/globals.css (--color-gr-primary-dark / --color-gr-primary)
const PRIMARY_DARK = '#2E4434';
const PRIMARY = '#3C5A44';

export default async function Image() {
  const logoBuffer = await readFile(join(process.cwd(), 'src/app/_assets/grano-rey-logo.png'));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${PRIMARY} 100%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={420} height={278} style={{ objectFit: 'contain' }} />
      </div>
    ),
    { ...size },
  );
}
