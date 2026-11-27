import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import type { LibrarySettings } from '../api/types';

export default function SettingsPage() {
  const { t } = useI18n();
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
      setMessage(t('set.saved'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('set.saveFail'));
    }
  };

  if (!settings) return <p className="page-message">{t('loading')}</p>;

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
      <h2>{t('set.title')}</h2>
      <form className="inline-form" onSubmit={save}>
        {field(t('set.loan_days'), 'loan_days')}
        {field(t('set.max_renewals'), 'max_renewals')}
        {field(t('set.fine_per_day'), 'fine_per_day', '0.01')}
        {field(t('set.reservation_days'), 'reservation_days')}
        {field(t('set.max_loan_days'), 'max_loan_days')}
        {field(t('set.max_fine_per_loan'), 'max_fine_per_loan', '0.01')}
        {field(t('set.lost_fee'), 'lost_fee', '0.01')}
        {field(t('set.damaged_fee'), 'damaged_fee', '0.01')}
        {field(t('set.digital_loan_days'), 'digital_loan_days')}
        {field(t('set.hold_pickup_days'), 'hold_pickup_days')}
        {field(t('set.max_open_loans'), 'max_open_loans')}
        <button type="submit">{t('set.save')}</button>
      </form>
      {message && <p>{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
