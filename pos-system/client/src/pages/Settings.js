import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Settings() {
  const [form, setForm] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    currency: 'LKR',
    currencySymbol: 'Rs.',
    taxRate: 0,
    receiptFooter: '',
    lowStockThreshold: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setForm(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await api.put('/settings', form);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Loading settings...</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      {success && <div className="alert alert-success mb-16"><i className="fa-solid fa-circle-check"></i>{success}</div>}
      {error && <div className="alert alert-danger mb-16"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}

      {/* Store Info */}
      <div className="card mb-24">
        <div className="card-header">
          <h3><i className="fa-solid fa-store" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Store Information</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input className="form-control" value={form.storeName} onChange={(e) => set('storeName', e.target.value)} placeholder="My Store" />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={form.storePhone} onChange={(e) => set('storePhone', e.target.value)} placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div className="col-12">
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.storeAddress} onChange={(e) => set('storeAddress', e.target.value)} placeholder="123 Main St, City, Country" />
              </div>
            </div>
            <div className="col-12">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.storeEmail} onChange={(e) => set('storeEmail', e.target.value)} placeholder="store@example.com" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax & Currency */}
      <div className="card mb-24">
        <div className="card-header">
          <h3><i className="fa-solid fa-percent" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Tax & Currency</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input type="number" className="form-control" value={form.taxRate} onChange={(e) => set('taxRate', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" />
                <small style={{ color: 'var(--gray)', fontSize: 12 }}>Applied automatically in billing</small>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Currency Code</label>
                <select className="form-control" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="LKR">LKR — Sri Lankan Rupee</option>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input className="form-control" value={form.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} placeholder="$" maxLength={3} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Settings */}
      <div className="card mb-24">
        <div className="card-header">
          <h3><i className="fa-solid fa-warehouse" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Inventory Settings</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Default Low Stock Threshold</label>
                <input type="number" className="form-control" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', parseInt(e.target.value) || 0)} min="0" />
                <small style={{ color: 'var(--gray)', fontSize: 12 }}>Alert when stock falls below this value</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Settings */}
      <div className="card mb-24">
        <div className="card-header">
          <h3><i className="fa-solid fa-receipt" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Receipt Settings</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Receipt Footer Message</label>
            <input className="form-control" value={form.receiptFooter} onChange={(e) => set('receiptFooter', e.target.value)} placeholder="Thank you for your purchase!" />
          </div>
          {/* Preview */}
          <div style={{ marginTop: 16 }}>
            <label className="form-label" style={{ marginBottom: 10 }}>Receipt Preview</label>
            <div className="receipt" style={{ maxWidth: 280 }}>
              <div className="receipt-header">
                <h2>{form.storeName || 'Store Name'}</h2>
                <p>{form.storeAddress || 'Store Address'}</p>
                <p>{form.storePhone}</p>
              </div>
              <hr className="receipt-divider" />
              <div className="receipt-item"><span>Sample Item x1</span><span>{form.currencySymbol}9.99</span></div>
              <div className="receipt-item"><span>Sample Item x2</span><span>{form.currencySymbol}19.98</span></div>
              <hr className="receipt-divider" />
              <div className="receipt-item"><span>Subtotal</span><span>{form.currencySymbol}29.97</span></div>
              <div className="receipt-item"><span>Tax ({form.taxRate}%)</span><span>{form.currencySymbol}{(29.97 * form.taxRate / 100).toFixed(2)}</span></div>
              <div className="receipt-total"><span>TOTAL</span><span>{form.currencySymbol}{(29.97 * (1 + form.taxRate / 100)).toFixed(2)}</span></div>
              <hr className="receipt-divider" />
              <div className="receipt-footer">{form.receiptFooter || 'Thank you!'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button className="btn btn-secondary" onClick={fetchSettings}>
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Saving...</> : <><i className="fa-solid fa-floppy-disk"></i> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
