import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

export interface PickItem {
  id: string;
  title: string;
  sub?: string;
}

// Search-as-you-type picker: staff find a person or copy by name, email, title or barcode and never see an id.
export default function Picker({
  placeholder,
  search,
  value,
  onChange,
  required,
}: {
  placeholder: string;
  search: (q: string) => Promise<PickItem[]>;
  value: PickItem | null;
  onChange: (item: PickItem | null) => void;
  required?: boolean;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<PickItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const h = setTimeout(() => {
      search(q).then((r) => live && setItems(r)).catch(() => live && setItems([]));
    }, 180);
    return () => {
      live = false;
      clearTimeout(h);
    };
  }, [q, open, search]);

  if (value) {
    return (
      <div className="picker-chosen">
        <span>
          <strong>{value.title}</strong>
          {value.sub && <span className="muted"> · {value.sub}</span>}
        </span>
        <button type="button" className="pill ghost" onClick={() => onChange(null)} aria-label={t('picker.clear')}>
          ×
        </button>
      </div>
    );
  }
  return (
    <div className="picker">
      <input
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        required={required}
        autoComplete="off"
      />
      {open && (
        <ul className="picker-list" role="listbox">
          {items.length === 0 && <li className="muted picker-empty">{t('picker.none')}</li>}
          {items.map((it) => (
            <li key={it.id} role="option" aria-selected="false">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(it); setQ(''); setOpen(false); }}>
                <strong>{it.title}</strong>
                {it.sub && <span className="muted"> · {it.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
