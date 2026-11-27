import { useCallback, useState } from 'react';
import { useI18n } from '../i18n';
import { fmtDate, fmtMoney } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import Scanner from '../components/Scanner';
import Picker, { type PickItem } from '../components/Picker';
import { findMembers } from '../components/lookups';

interface MemberInfo { id: string; full_name: string; email: string; active_loans: number; overdue_loans: number; unpaid_fines: number }
interface CopyInfo { id: string; barcode: string; status: string; book_title: string; branch_name: string }
interface OpenLoan { id: string; member_name: string; due_at: string; overdue: boolean }
type Resolved = { kind: 'member'; member: MemberInfo } | { kind: 'copy'; copy: CopyInfo; loan: OpenLoan | null };

// Staff desk: scan a member card and a book to borrow, or scan a book to return it.
export default function DeskPage() {
  const { t, lang } = useI18n();
  useCalendar();
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [copy, setCopy] = useState<{ copy: CopyInfo; loan: OpenLoan | null } | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => setErr(e instanceof ApiError ? e.message : t('desk.failed'));

  const onCode = useCallback(
    async (code: string) => {
      setErr('');
      setMsg('');
      setBusy(true);
      try {
        const r = await api.post<Resolved>('/desk/resolve', { code });
        if (r.kind === 'member') {
          setMember(r.member);
          setCopy(null);
        } else {
          setCopy({ copy: r.copy, loan: r.loan });
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) setErr(t('desk.unknown'));
        else fail(e);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const pickMember = async (item: PickItem | null) => {
    if (!item) return setMember(null);
    setBusy(true);
    try {
      const m = await api.get<{ id: string; full_name: string; email: string }>(`/members/${item.id}`);
      setMember({ ...m, active_loans: 0, overdue_loans: 0, unpaid_fines: 0 });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const doReturn = async () => {
    if (!copy?.loan) return;
    setBusy(true);
    setErr('');
    try {
      await api.post(`/loans/${copy.loan.id}/return`);
      setMsg(`${t('desk.returned')}: ${copy.copy.book_title}`);
      setCopy(null);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const doBorrow = async () => {
    if (!copy || !member) return;
    setBusy(true);
    setErr('');
    try {
      await api.post('/loans', { copy_id: copy.copy.id, member_id: member.id });
      setMsg(`${t('desk.borrowed')}: ${copy.copy.book_title} · ${member.full_name}`);
      setCopy(null);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const available = copy?.copy.status === 'available' && !copy.loan;

  return (
    <>
      <div className="panel">
        <h2>{t('desk.title')}</h2>
        <p className="muted">{t('desk.hint')}</p>
        <Scanner onCode={onCode} busy={busy} />
        {msg && <p role="status" className="ok-text">{msg}</p>}
        {err && <p role="alert" className="error-text">{err}</p>}
      </div>

      <div className="panel">
        <h2>{t('desk.member')}</h2>
        {member ? (
          <div className="desk-card">
            <strong>{member.full_name}</strong>
            <span className="muted">{member.email}</span>
            <span>{t('desk.activeLoans')}: {member.active_loans} · {t('desk.overdue')}: {member.overdue_loans} · {t('desk.fines')}: {fmtMoney(member.unpaid_fines, lang)}</span>
            <button type="button" className="pill ghost" onClick={() => setMember(null)}>{t('desk.clear')}</button>
          </div>
        ) : (
          <Picker placeholder={t('loans.pickMember')} search={findMembers} value={null} onChange={pickMember} />
        )}
      </div>

      {copy && (
        <div className="panel">
          <h2>{t('desk.book')}</h2>
          <div className="desk-card">
            <strong>{copy.copy.book_title}</strong>
            <span className="muted">{copy.copy.barcode} · {copy.copy.branch_name}</span>
            {copy.loan ? (
              <>
                <span>{t('desk.onLoan')} {copy.loan.member_name} · {t('desk.due')} {fmtDate(copy.loan.due_at, lang)}{copy.loan.overdue ? ` · ${t('desk.overdue')}` : ''}</span>
                <button type="button" className="pill" onClick={doReturn} disabled={busy}>{t('desk.return')}</button>
              </>
            ) : available ? (
              member ? (
                <button type="button" className="pill" onClick={doBorrow} disabled={busy}>{t('desk.borrowFor')} {member.full_name}</button>
              ) : (
                <span>{t('desk.scanMemberFirst')}</span>
              )
            ) : (
              <span>{t('desk.notAvailable')}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
