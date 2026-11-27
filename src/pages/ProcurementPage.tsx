import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { fmtDate, fmtMoney } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type {
  Branch,
  PurchaseOrderWithItems,
  Supplier,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';

export default function ProcurementPage() {
  const { lang, t } = useI18n();
  useCalendar();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderWithItems[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [supplierForm, setSupplierForm] = useState({ name: '', email: '' });
  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    branchId: '',
    bookId: '',
    quantity: 1,
    unitCost: '0.00',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setSuppliers(await api.get<Supplier[]>('/suppliers'));
      const list = await api.get<{ id: string }[]>('/purchase-orders');
      const full = await Promise.all(
        list.map((o) => api.get<PurchaseOrderWithItems>(`/purchase-orders/${o.id}`)),
      );
      setOrders(full);
    } catch (e) {
      setError((e as Error).message);
    }
    api
      .get<Branch[]>('/branches')
      .then(setBranches)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const supplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name ?? id;

  const addSupplier = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/suppliers', {
        name: supplierForm.name,
        email: supplierForm.email || undefined,
      });
      setSupplierForm({ name: '', email: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('po.supFail'));
    }
  };

  const addOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/purchase-orders', {
        supplier_id: orderForm.supplierId,
        branch_id: orderForm.branchId,
        items: [
          {
            book_id: orderForm.bookId,
            quantity: orderForm.quantity,
            unit_cost: Number(orderForm.unitCost),
          },
        ],
      });
      setMessage(t('po.created'));
      setOrderForm({ ...orderForm, bookId: '', quantity: 1, unitCost: '0.00' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('po.createFail'));
    }
  };

  const act = async (id: string, action: string, ok: string) => {
    setError('');
    setMessage('');
    try {
      await api.post(`/purchase-orders/${id}/${action}`);
      setMessage(ok);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('tr.actFail'));
    }
  };

  return (
    <>
      <div className="panel">
        <h2>{t('po.suppliers')}</h2>
        {error && <p className="error-text">{error}</p>}
        {message && <p>{message}</p>}
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.email')}</th>
              <th>{t('po.active')}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email ?? '—'}</td>
                <td>{s.active ? t('po.yes') : t('po.no')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && (
          <form className="inline-form" onSubmit={addSupplier}>
            <input
              placeholder={t('po.supName')}
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, name: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder={t('po.emailOpt')}
              value={supplierForm.email}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, email: e.target.value })
              }
            />
            <button type="submit">{t('po.addSup')}</button>
          </form>
        )}
      </div>

      <div className="panel">
        <h2>{t('po.new')}</h2>
        <form className="inline-form" onSubmit={addOrder}>
          <select
            value={orderForm.supplierId}
            onChange={(e) =>
              setOrderForm({ ...orderForm, supplierId: e.target.value })
            }
            required
          >
            <option value="">{t('po.supplier')}</option>
            {suppliers
              .filter((s) => s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <select
            value={orderForm.branchId}
            onChange={(e) =>
              setOrderForm({ ...orderForm, branchId: e.target.value })
            }
            required
          >
            <option value="">{t('po.branch')}</option>
            {branches
              .filter((b) => b.is_active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
          <input
            placeholder={t('po.bookId')}
            value={orderForm.bookId}
            onChange={(e) =>
              setOrderForm({ ...orderForm, bookId: e.target.value })
            }
            required
          />
          <input
            type="number"
            min={1}
            value={orderForm.quantity}
            onChange={(e) =>
              setOrderForm({ ...orderForm, quantity: Number(e.target.value) })
            }
            required
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={orderForm.unitCost}
            onChange={(e) =>
              setOrderForm({ ...orderForm, unitCost: e.target.value })
            }
            required
          />
          <button type="submit">{t('po.createBtn')}</button>
        </form>
      </div>

      <div className="panel">
        <h2>{t('po.orders')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('po.supplier')}</th>
              <th>{t('po.items')}</th>
              <th>{t('common.status')}</th>
              <th>{t('po.created2')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{supplierName(o.supplier_id)}</td>
                <td>
                  {o.items
                    .map((i) => `${i.quantity} x ${fmtMoney(i.unit_cost, lang)}`)
                    .join(', ')}
                </td>
                <td>
                  <span className="badge">{t(`po.s.${o.status}`)}</span>
                </td>
                <td>{fmtDate(o.created_at, lang)}</td>
                <td>
                  {o.status === 'draft' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => act(o.id, 'order', t('po.marked'))}
                      >
                        {t('po.order')}
                      </button>{' '}
                      <button
                        type="button"
                        className="danger"
                        onClick={() => act(o.id, 'cancel', t('po.cancelled'))}
                      >
                        {t('po.cancel')}
                      </button>
                    </>
                  )}
                  {o.status === 'ordered' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => act(o.id, 'receive', t('po.received'))}
                      >
                        {t('po.receive')}
                      </button>{' '}
                      <button
                        type="button"
                        className="danger"
                        onClick={() => act(o.id, 'cancel', t('po.cancelled'))}
                      >
                        {t('po.cancel')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
