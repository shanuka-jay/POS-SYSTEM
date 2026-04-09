import React, { useState, useEffect } from 'react';
import api from '../services/api';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditCustomer(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (c) => { setEditCustomer(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' }); setError(''); setShowModal(true); };

  const openHistory = async (customer) => {
    setShowHistory(customer);
    try {
      const res = await api.get(`/customers/${customer._id}/history`);
      setHistoryData(res.data);
    } catch {}
  };

  const handleSave = async () => {
    if (!form.name) { setError('Customer name is required'); return; }
    setSaving(true); setError('');
    try {
      if (editCustomer) {
        await api.put(`/customers/${editCustomer._id}`, form);
      } else {
        await api.post('/customers', form);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch {
      alert('Failed to delete customer');
    }
  };

  const filtered = customers.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)) || (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const fmt = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

  return (
    <div>
      <div className="flex-between mb-24">
        <div className="search-box" style={{ flex: 1, maxWidth: 340 }}>
          <i className="fa-solid fa-search"></i>
          <input className="form-control" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="fa-solid fa-user-plus"></i> Add Customer</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><i className="fa-solid fa-users" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Customers ({filtered.length})</h3>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: 14, flexShrink: 0 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.phone || <span className="text-gray">—</span>}</td>
                    <td>{c.email || <span className="text-gray">—</span>}</td>
                    <td><span className="badge badge-primary">{c.totalPurchases}</span></td>
                    <td><strong>{fmt(c.totalSpent)}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openHistory(c)} title="View history"><i className="fa-solid fa-clock-rotate-left"></i></button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><i className="fa-solid fa-pen"></i></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id, c.name)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="6"><div className="empty-state"><i className="fa-solid fa-users"></i><h3>No customers found</h3></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Smith" />
              </div>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-0100" />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : <><i className="fa-solid fa-check"></i> {editCustomer ? 'Update' : 'Add Customer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHistory(null); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8 }}></i>Purchase History — {showHistory.name}</h3>
              <button className="modal-close" onClick={() => setShowHistory(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {historyData.length === 0 ? (
                <div className="empty-state"><i className="fa-solid fa-receipt"></i><h3>No purchases yet</h3></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Sale #</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th></tr>
                  </thead>
                  <tbody>
                    {historyData.map((sale) => (
                      <tr key={sale._id}>
                        <td><span className="badge badge-primary">{sale.saleNumber}</span></td>
                        <td style={{ fontSize: 12 }}>{new Date(sale.createdAt).toLocaleString()}</td>
                        <td>{sale.items.length} item(s)</td>
                        <td><strong>{fmt(sale.total)}</strong></td>
                        <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
