import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleAdjust = async () => {
    if (!adjustQty) return;
    setSaving(true);
    try {
      const newStock = Math.max(0, adjustModal.stock + parseInt(adjustQty));
      await api.put(`/products/${adjustModal._id}`, { stock: newStock });
      setAdjustModal(null);
      setAdjustQty('');
      setAdjustNote('');
      fetchProducts();
    } catch { alert('Failed to update stock'); }
    finally { setSaving(false); }
  };

  const handleSetStock = async (id, stock) => {
    setSaving(true);
    try {
      await api.put(`/products/${id}`, { stock: Math.max(0, parseInt(stock)) });
      fetchProducts();
    } catch {}
    finally { setSaving(false); }
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'low' && p.stock <= p.lowStockThreshold && p.stock > 0) || (filter === 'out' && p.stock <= 0) || (filter === 'ok' && p.stock > p.lowStockThreshold);
    return matchSearch && matchFilter;
  });

  const lowCount = products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  const outCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-check-circle"></i></div>
          <div className="stat-info"><div className="label">In Stock</div><div className="value">{products.filter(p => p.stock > p.lowStockThreshold).length}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><i className="fa-solid fa-triangle-exclamation"></i></div>
          <div className="stat-info"><div className="label">Low Stock</div><div className="value">{lowCount}</div><div className="sub">Needs restocking</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="fa-solid fa-xmark-circle"></i></div>
          <div className="stat-info"><div className="label">Out of Stock</div><div className="value">{outCount}</div></div>
        </div>
      </div>

      <div className="flex-between mb-24">
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ minWidth: 220 }}>
            <i className="fa-solid fa-search"></i>
            <input className="form-control" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'ok', 'low', 'out'].map((f) => (
              <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f === 'all' ? 'All' : f === 'ok' ? 'In Stock' : f === 'low' ? 'Low Stock' : 'Out of Stock'}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><i className="fa-solid fa-warehouse" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Inventory ({filtered.length} items)</h3>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Low Stock Alert</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.sku}</code></td>
                    <td><span className="badge badge-primary">{p.category}</span></td>
                    <td>
                      <span style={{ fontSize: 18, fontWeight: 700, color: p.stock <= 0 ? 'var(--danger)' : p.stock <= p.lowStockThreshold ? 'var(--warning)' : 'var(--success)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>{p.lowStockThreshold}</td>
                    <td>
                      {p.stock <= 0 ? <span className="badge badge-danger"><i className="fa-solid fa-xmark" style={{ marginRight: 4 }}></i>Out of Stock</span>
                        : p.stock <= p.lowStockThreshold ? <span className="badge badge-warning"><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>Low Stock</span>
                        : <span className="badge badge-success"><i className="fa-solid fa-check" style={{ marginRight: 4 }}></i>Good</span>}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => { setAdjustModal(p); setAdjustQty(''); }}>
                        <i className="fa-solid fa-arrows-up-down"></i> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="7"><div className="empty-state"><i className="fa-solid fa-warehouse"></i><h3>No products match</h3></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {adjustModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAdjustModal(null); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Adjust Stock — {adjustModal.name}</h3>
              <button className="modal-close" onClick={() => setAdjustModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-gray">Current Stock</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{adjustModal.stock}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Adjustment (use + or - number)</label>
                <input type="number" className="form-control" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. +50 or -10" />
              </div>
              {adjustQty && (
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                  New Stock: {Math.max(0, adjustModal.stock + parseInt(adjustQty || 0))}
                </div>
              )}
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Note (optional)</label>
                <input className="form-control" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. Received new shipment" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdjust} disabled={saving || !adjustQty}>
                {saving ? 'Saving...' : <><i className="fa-solid fa-check"></i> Apply</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
