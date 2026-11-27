import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { fmtDate } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type {
  Branch,
  PurchaseOrderWithItems,
  Supplier,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';

export default function ProcurementPage() {
  const { lang } = useI18n();
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
      setError(err instanceof ApiError ? err.message : 'could not add supplier');
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
      setMessage('Purchase order created.');
      setOrderForm({ ...orderForm, bookId: '', quantity: 1, unitCost: '0.00' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'could not create order');
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
      setError(err instanceof ApiError ? err.message : 'action failed');
    }
  };

  return (
    <>
      <div className="panel">
        <h2>Suppliers</h2>
        {error && <p className="error-text">{error}</p>}
        {message && <p>{message}</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email ?? '—'}</td>
                <td>{s.active ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && (
          <form className="inline-form" onSubmit={addSupplier}>
            <input
              placeholder="Supplier name"
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, name: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={supplierForm.email}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, email: e.target.value })
              }
            />
            <button type="submit">Add supplier</button>
          </form>
        )}
      </div>

      <div className="panel">
        <h2>New purchase order</h2>
        <form className="inline-form" onSubmit={addOrder}>
          <select
            value={orderForm.supplierId}
            onChange={(e) =>
              setOrderForm({ ...orderForm, supplierId: e.target.value })
            }
            required
          >
            <option value="">Supplier</option>
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
            <option value="">Branch</option>
            {branches
              .filter((b) => b.is_active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
          <input
            placeholder="Book ID"
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
          <button type="submit">Create order</button>
        </form>
      </div>

      <div className="panel">
        <h2>Purchase orders</h2>
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Items</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{supplierName(o.supplier_id)}</td>
                <td>
                  {o.items
                    .map((i) => `${i.quantity} x ${i.unit_cost.toFixed(2)}`)
                    .join(', ')}
                </td>
                <td>
                  <span className="badge">{o.status}</span>
                </td>
                <td>{fmtDate(o.created_at, lang)}</td>
                <td>
                  {o.status === 'draft' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => act(o.id, 'order', 'Marked ordered.')}
                      >
                        Order
                      </button>{' '}
                      <button
                        type="button"
                        className="danger"
                        onClick={() => act(o.id, 'cancel', 'Cancelled.')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {o.status === 'ordered' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => act(o.id, 'receive', 'Received.')}
                      >
                        Receive
                      </button>{' '}
                      <button
                        type="button"
                        className="danger"
                        onClick={() => act(o.id, 'cancel', 'Cancelled.')}
                      >
                        Cancel
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
