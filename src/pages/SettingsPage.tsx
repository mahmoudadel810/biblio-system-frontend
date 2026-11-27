import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { LibrarySettings } from '../api/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get<LibrarySettings>('/settings')
      .then(setSettings)
      .catch((e) => setError(e.message));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setError('');
    setMessage('');
    try {
      const updated = await api.patch<LibrarySettings>('/settings', settings);
      setSettings(updated);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'save failed');
    }
  };

  if (!settings) return <p className="page-message">Loading…</p>;

  const field = (
    label: string,
    key: keyof LibrarySettings,
    step = '1',
  ) => (
    <label>
      {label}{' '}
      <input
        type="number"
        min={0}
        step={step}
        value={settings[key]}
        onChange={(e) =>
          setSettings({ ...settings, [key]: Number(e.target.value) })
        }
      />
    </label>
  );

  return (
    <div className="panel">
      <h2>Library settings</h2>
      <form className="inline-form" onSubmit={save}>
        {field('Loan days', 'loan_days')}
        {field('Max renewals', 'max_renewals')}
        {field('Fine per day (SAR)', 'fine_per_day', '0.01')}
        {field('Reservation days', 'reservation_days')}
        {field('Max loan days (members may pick up to this)', 'max_loan_days')}
        {field('Max fine per loan (SAR, late fine stops here)', 'max_fine_per_loan', '0.01')}
        {field('Lost book fee (SAR)', 'lost_fee', '0.01')}
        {field('Damaged book fee (SAR)', 'damaged_fee', '0.01')}
        {field('Digital loan days', 'digital_loan_days')}
        {field('Hold pickup days', 'hold_pickup_days')}
        {field('Max books on loan at once', 'max_open_loans')}
        <button type="submit">Save</button>
      </form>
      {message && <p>{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
