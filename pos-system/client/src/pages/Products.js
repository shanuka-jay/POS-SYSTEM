import React, { useState, useEffect } from 'react';
import api from '../services/api';

const emptyForm = { name: '', sku: '', category: '', price: '', cost: '', stock: '', lowStockThreshold: 10, description: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
    } catch {}
  };

  const openAdd = () => { setEditProduct(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, sku: p.sku, category: p.category, price: p.price, cost: p.cost, stock: p.stock, lowStockThreshold: p.lowStockThreshold, description: p.description || '' }); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.category || !form.price) { setError('Please fill all required fields'); return; }
    setSaving(true); setError('');
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, form);
      } else {
        await api.post('/products', form);
      }
      setShowModal(false);
      fetchProducts(); fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const fmt = (n) => `Rs. ${Math.round(parseFloat(n || 0)).toLocaleString()}`;

  return (
    <div>
      <div className="flex-between mb-24">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box" style={{ minWidth: 220 }}>
            <i className="fa-solid fa-search"></i>
            <input className="form-control" placeholder="Search name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <select className="form-control" value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ width: 160 }}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="fa-solid fa-plus"></i> Add Product</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><i className="fa-solid fa-box" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Products ({filtered.length})</h3>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'var(--gray)' }}>{p.description}</div>}
                    </td>
                    <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.sku}</code></td>
                    <td><span className="badge badge-primary">{p.category}</span></td>
                    <td><strong>{fmt(p.price)}</strong></td>
                    <td>{fmt(p.cost)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: p.stock <= 0 ? 'var(--danger)' : p.stock <= p.lowStockThreshold ? 'var(--warning)' : 'var(--success)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      {p.stock <= 0 ? <span className="badge badge-danger">Out of Stock</span>
                        : p.stock <= p.lowStockThreshold ? <span className="badge badge-warning"><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>Low Stock</span>
                        : <span className="badge badge-success">In Stock</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><i className="fa-solid fa-pen"></i></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id, p.name)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="8"><div className="empty-state"><i className="fa-solid fa-box-open"></i><h3>No products found</h3></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coca Cola 500ml" />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="e.g. BEV-001" />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Beverages" list="cats" />
                    <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Price *</label>
                    <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Cost Price</label>
                    <input type="number" className="form-control" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity *</label>
                    <input type="number" className="form-control" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" min="0" />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Low Stock Alert</label>
                    <input type="number" className="form-control" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="10" min="0" />
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : <><i className="fa-solid fa-check"></i> {editProduct ? 'Update' : 'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

