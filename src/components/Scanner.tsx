import { useEffect, useRef, useState, type FormEvent } from 'react';
import jsQR from 'jsqr';
import { useI18n } from '../i18n';

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

// Camera scanner with a typed fallback. Uses the browser's BarcodeDetector where it exists (QR and
// common 1D barcodes) and jsQR for QR codes everywhere else. A USB barcode scanner types into the box.
export default function Scanner({ onCode, busy }: { onCode: (code: string) => void; busy?: boolean }) {
  const { t } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number>(0);
  const last = useRef({ code: '', at: 0 });
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');
  const [typed, setTyped] = useState('');
  const handler = useRef(onCode);
  handler.current = onCode;

  const stop = () => {
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setOn(false);
  };
  useEffect(() => stop, []);

  const emit = (code: string) => {
    const now = Date.now();
    if (code === last.current.code && now - last.current.at < 3000) return;
    last.current = { code, at: now };
    handler.current(code);
  };

  const start = async () => {
    setErr('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr(t('scan.nocam'));
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      stream.current = s;
      setOn(true);
      await new Promise((r) => setTimeout(r, 50));
      const v = video.current;
      if (!v) return;
      v.srcObject = s;
      await v.play();
      const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
      const det = Ctor ? new Ctor({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'] }) : null;
      const canvas = document.createElement('canvas');
      timer.current = window.setInterval(async () => {
        if (v.readyState < 2 || !v.videoWidth) return;
        try {
          if (det) {
            const found = await det.detect(v);
            if (found[0]?.rawValue) emit(found[0].rawValue);
          } else {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hit = jsQR(img.data, img.width, img.height);
            if (hit?.data) emit(hit.data);
          }
        } catch {
          /* a bad frame is skipped */
        }
      }, 250);
    } catch {
      setErr(t('scan.denied'));
      stop();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = typed.trim();
    if (!c) return;
    setTyped('');
    handler.current(c);
  };

  return (
    <div className="scanner">
      {on ? (
        <div className="scan-view">
          <video ref={video} muted playsInline aria-label={t('scan.camera')} />
          <div className="scan-frame" aria-hidden="true" />
        </div>
      ) : null}
      <div className="scan-actions">
        {on ? (
          <button type="button" className="pill ghost" onClick={stop}>{t('scan.stop')}</button>
        ) : (
          <button type="button" className="pill" onClick={start} disabled={busy}>{t('scan.start')}</button>
        )}
      </div>
      {err && <p className="error-text" role="alert">{err}</p>}
      <form className="scan-type" onSubmit={submit}>
        <label className="sr-only" htmlFor="scan-input">{t('scan.type')}</label>
        <input id="scan-input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t('scan.type')} autoComplete="off" />
        <button type="submit" className="pill ghost" disabled={busy}>{t('scan.go')}</button>
      </form>
    </div>
  );
}
