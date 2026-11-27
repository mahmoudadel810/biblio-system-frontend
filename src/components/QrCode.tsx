import qrcode from 'qrcode-generator';

// Draws a QR code as one flat SVG path. No images, no network.
export default function QrCode({ value, label, size = 240 }: { value: string; label: string; size?: number }) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 3;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  const dim = n + quiet * 2;
  return (
    <svg className="qr" role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${dim} ${dim}`} shapeRendering="crispEdges">
      <rect width={dim} height={dim} fill="#fff" />
      <path d={d} fill="#1b1b1b" />
    </svg>
  );
}
