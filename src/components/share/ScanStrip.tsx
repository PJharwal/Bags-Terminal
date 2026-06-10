// Signature "scan strip" for share cards: turns a plain URL into a hero element —
// a deterministic faux-barcode (unique per link) + a framed, glowing handle.
// Inline styles only (these cards render to PNG via html-to-image).

const mono = "'Courier New', Courier, monospace";

function barsFromUrl(url: string, count = 46): { w: number; h: number; tall: boolean }[] {
  const bars: { w: number; h: number; tall: boolean }[] = [];
  for (let i = 0; bars.length < count; i++) {
    const c = url.charCodeAt(i % url.length) + i * 7;
    bars.push({ w: 1 + (c % 4), h: 45 + (c % 55), tall: c % 5 === 0 });
  }
  return bars;
}

export function ScanStrip({ url, accent }: { url: string; accent: string }) {
  const handle = (url || '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');
  const bars = barsFromUrl(url || 'bagsterminal.fm');

  return (
    <div
      style={{
        position: 'relative',
        marginTop: 16,
        padding: '11px 13px 9px',
        background: '#080808',
        border: `1px solid ${accent}38`,
        boxShadow: `inset 0 0 22px ${accent}10`,
      }}
    >
      {/* register/crop-mark corners */}
      {[
        { top: -1, left: -1, bt: true, bl: true },
        { top: -1, right: -1, bt: true, br: true },
        { bottom: -1, left: -1, bb: true, bl: true },
        { bottom: -1, right: -1, bb: true, br: true },
      ].map((c, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: 7, height: 7,
            top: c.top, bottom: c.bottom, left: c.left, right: c.right,
            borderTop: c.bt ? `1.5px solid ${accent}` : undefined,
            borderBottom: c.bb ? `1.5px solid ${accent}` : undefined,
            borderLeft: c.bl ? `1.5px solid ${accent}` : undefined,
            borderRight: c.br ? `1.5px solid ${accent}` : undefined,
          }}
        />
      ))}

      {/* faux barcode — deterministic signature of this link */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 30, marginBottom: 8 }}>
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              width: b.w,
              height: `${b.h}%`,
              background: b.tall ? '#FFFFFF' : accent,
              opacity: b.tall ? 0.9 : 0.7,
              boxShadow: b.tall ? `0 0 4px ${accent}66` : 'none',
            }}
          />
        ))}
      </div>

      {/* handle row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: mono,
            color: '#EDEDED',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ color: accent }}>&gt;_</span> {handle}
        </span>
        <span
          style={{
            fontSize: 8,
            fontFamily: mono,
            color: accent,
            letterSpacing: '0.22em',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          SCAN · LAUNCH
        </span>
      </div>
    </div>
  );
}
