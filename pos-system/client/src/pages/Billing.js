import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const CART_KEY = 'pos_offline_cart';

// Inject a print stylesheet once into the document head
const injectPrintStyles = () => {
  if (document.getElementById('receipt-print-style')) return;
  const style = document.createElement('style');
  style.id = 'receipt-print-style';
  style.innerHTML = `
    @media print {
      body > * { display: none !important; }
      #receipt-print-root { display: block !important; }
      #receipt-print-root {
        position: fixed;
        top: 0; left: 0;
        width: 100%;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #000;
        background: #fff;
        padding: 0;
        margin: 0;
      }
      @page {
        size: 80mm auto;
        margin: 8mm;
      }
    }
    #receipt-print-root { display: none; }
  `;
  document.head.appendChild(style);
};

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(8);
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [error, setError] = useState('');
  const printRootRef = useRef(null);

  useEffect(() => {
    injectPrintStyles();
    fetchInitialData();
    loadOfflineCart();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsRes, customersRes, settingsRes, catsRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/settings'),
        api.get('/products/categories'),
      ]);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      setSettings(settingsRes.data);
      setTaxRate(settingsRes.data.taxRate || 8);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOfflineCart = () => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) setCart(parsed);
      } catch {}
    }
  };

  const saveCartOffline = useCallback((cartData) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  }, []);

  const addToCart = (product) => {
    if (product.stock <= 0) { setError(`${product.name} is out of stock`); return; }
    setError('');
    setCart((prev) => {
      const existing = prev.find((i) => i.product === product._id);
      let newCart;
      if (existing) {
        if (existing.quantity >= product.stock) { setError(`Only ${product.stock} units available`); return prev; }
        newCart = prev.map((i) => i.product === product._id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i);
      } else {
        newCart = [...prev, { product: product._id, name: product.name, sku: product.sku, price: product.price, cost: product.cost, quantity: 1, subtotal: product.price, maxStock: product.stock }];
      }
      saveCartOffline(newCart);
      return newCart;
    });
  };

  const updateQuantity = (productId, quantity) => {
    const item = cart.find((i) => i.product === productId);
    if (!item) return;
    if (quantity < 1) { removeFromCart(productId); return; }
    if (quantity > item.maxStock) { setError(`Only ${item.maxStock} units available`); return; }
    setError('');
    setCart((prev) => {
      const newCart = prev.map((i) => i.product === productId ? { ...i, quantity, subtotal: quantity * i.price } : i);
      saveCartOffline(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const newCart = prev.filter((i) => i.product !== productId);
      saveCartOffline(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_KEY);
    setDiscount(0);
    setSelectedCustomer('');
    setAmountPaid('');
    setError('');
  };

  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const taxAmount = ((subtotal - discount) * taxRate) / 100;
  const total = subtotal - discount + taxAmount;
  const change = paymentMethod === 'cash' && amountPaid ? parseFloat(amountPaid) - total : 0;

  const filteredProducts = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) { setError('Cart is empty'); return; }
    if (paymentMethod === 'cash' && amountPaid && parseFloat(amountPaid) < total) { setError('Amount paid is less than total'); return; }
    setLoading(true);
    setError('');
    try {
      const saleData = {
        items: cart.map((i) => ({ product: i.product, name: i.name, sku: i.sku, quantity: i.quantity, price: i.price, cost: i.cost || 0, subtotal: i.subtotal })),
        customer: selectedCustomer || null,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        paymentMethod,
        amountPaid: parseFloat(amountPaid) || total,
      };
      const res = await api.post('/sales', saleData);
      setCompletedSale(res.data);
      clearCart();
      await fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  // Build the receipt HTML string used for both print and PDF-save
  const buildReceiptHTML = (sale, storeSettings) => {
    const sym = storeSettings?.currencySymbol || 'Rs.';
    const f = (n) => `${sym}${(n || 0).toFixed(2)}`;
    const lines = sale.items.map((item) => `
      <div style="margin-bottom:4px;">
        <div>${item.name}</div>
        <div style="display:flex;justify-content:space-between;padding-left:12px;">
          <span>${item.quantity} x ${f(item.price)}</span>
          <span>${f(item.subtotal)}</span>
        </div>
      </div>`).join('');

    return `
      <div style="max-width:300px;margin:0 auto;font-family:'Courier New',monospace;font-size:13px;color:#000;padding:16px;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-size:18px;font-weight:bold;">${storeSettings?.storeName || 'POS Store'}</div>
          ${storeSettings?.storeAddress ? `<div>${storeSettings.storeAddress}</div>` : ''}
          ${storeSettings?.storePhone ? `<div>${storeSettings.storePhone}</div>` : ''}
          <div style="margin-top:6px;">${new Date(sale.createdAt).toLocaleString()}</div>
          <div><strong>Receipt #${sale.saleNumber}</strong></div>
        </div>
        <hr style="border:none;border-top:1px dashed #000;margin:10px 0;" />
        ${lines}
        <hr style="border:none;border-top:1px dashed #000;margin:10px 0;" />
        <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${f(sale.subtotal)}</span></div>
        ${sale.discount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Discount</span><span>-${f(sale.discount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;"><span>Tax (${sale.taxRate}%)</span><span>${f(sale.taxAmount)}</span></div>
        <hr style="border:none;border-top:1px dashed #000;margin:10px 0;" />
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;">
          <span>TOTAL</span><span>${f(sale.total)}</span>
        </div>
        <div style="margin-top:6px;display:flex;justify-content:space-between;">
          <span>Payment (${sale.paymentMethod})</span><span>${f(sale.amountPaid)}</span>
        </div>
        ${sale.change > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Change</span><span>${f(sale.change)}</span></div>` : ''}
        ${sale.customer ? `<div style="margin-top:6px;"><strong>Customer:</strong> ${sale.customer.name}</div>` : ''}
        ${sale.cashier ? `<div><strong>Served by:</strong> ${sale.cashier.name}</div>` : ''}
        <hr style="border:none;border-top:1px dashed #000;margin:10px 0;" />
        <div style="text-align:center;font-size:12px;">${storeSettings?.receiptFooter || 'Thank you!'}</div>
        <div style="text-align:center;font-size:11px;margin-top:4px;color:#555;">Powered by QuickPOS</div>
      </div>`;
  };

  // Print: inject into hidden div and call window.print()
  const handlePrint = () => {
    if (!completedSale) return;
    const html = buildReceiptHTML(completedSale, settings);
    const el = document.getElementById('receipt-print-root');
    if (el) {
      el.innerHTML = html;
      window.print();
    }
  };

  // Save as PDF: open a new window, write receipt HTML, trigger print-to-PDF
  const handleSavePDF = () => {
    if (!completedSale) return;
    const html = buildReceiptHTML(completedSale, settings);
    const win = window.open('', '_blank', 'width=400,height=700');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${completedSale.saleNumber}</title>
  <style>
    body { margin: 0; padding: 0; background: #fff; }
    @media print {
      @page { size: 80mm auto; margin: 6mm; }
      body { margin: 0; }
    }
  </style>
</head>
<body>${html}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 300);
  };
<\/script>
</body>
</html>`);
    win.document.close();
  };

  const fmt = (n) => `${settings?.currencySymbol || 'Rs.'} ${Math.round(n || 0).toLocaleString()}`;

  // ─── Receipt screen after checkout ───────────────────────────────────────
  if (completedSale) {
    return (
      <>
        {/* Hidden print target — only visible during window.print() */}
        <div id="receipt-print-root" ref={printRootRef}></div>

        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="alert alert-success mb-16">
            <i className="fa-solid fa-circle-check"></i>
            <strong>Payment successful!</strong> Sale {completedSale.saleNumber} completed.
          </div>

          <div className="card">
            <div className="card-header">
              <h3><i className="fa-solid fa-receipt" style={{ marginRight: 8 }}></i>Receipt</h3>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrint}
                  title="Send to printer"
                >
                  <i className="fa-solid fa-print"></i> Print
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleSavePDF}
                  title="Save as PDF file"
                >
                  <i className="fa-solid fa-file-pdf"></i> Save PDF
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setCompletedSale(null); setPaymentMethod('cash'); }}
                >
                  <i className="fa-solid fa-plus"></i> New Sale
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* On-screen receipt preview */}
              <div className="receipt">
                <div className="receipt-header">
                  <h2>{settings?.storeName || 'POS Store'}</h2>
                  {settings?.storeAddress && <p>{settings.storeAddress}</p>}
                  {settings?.storePhone && <p>{settings.storePhone}</p>}
                  <p>{new Date(completedSale.createdAt).toLocaleString()}</p>
                  <p><strong>#{completedSale.saleNumber}</strong></p>
                </div>
                <hr className="receipt-divider" />
                {completedSale.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="receipt-item"><span>{item.name}</span></div>
                    <div className="receipt-item">
                      <span style={{ paddingLeft: 10 }}>{item.quantity} x {fmt(item.price)}</span>
                      <span>{fmt(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
                <hr className="receipt-divider" />
                <div className="receipt-item"><span>Subtotal</span><span>{fmt(completedSale.subtotal)}</span></div>
                {completedSale.discount > 0 && (
                  <div className="receipt-item"><span>Discount</span><span>-{fmt(completedSale.discount)}</span></div>
                )}
                <div className="receipt-item">
                  <span>Tax ({completedSale.taxRate}%)</span>
                  <span>{fmt(completedSale.taxAmount)}</span>
                </div>
                <hr className="receipt-divider" />
                <div className="receipt-total"><span>TOTAL</span><span>{fmt(completedSale.total)}</span></div>
                <div className="receipt-item" style={{ marginTop: 8 }}>
                  <span>Payment ({completedSale.paymentMethod})</span>
                  <span>{fmt(completedSale.amountPaid)}</span>
                </div>
                {completedSale.change > 0 && (
                  <div className="receipt-item"><span>Change</span><span>{fmt(completedSale.change)}</span></div>
                )}
                {completedSale.customer && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <strong>Customer:</strong> {completedSale.customer.name}
                  </div>
                )}
                {completedSale.cashier && (
                  <div style={{ fontSize: 12 }}>
                    <strong>Served by:</strong> {completedSale.cashier.name}
                  </div>
                )}
                <hr className="receipt-divider" />
                <div className="receipt-footer">{settings?.receiptFooter}</div>
              </div>

              {/* Hint text */}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray)', marginTop: 16 }}>
                <i className="fa-solid fa-lightbulb" style={{ marginRight: 5 }}></i>
                Use <strong>Print</strong> for a physical receipt or <strong>Save PDF</strong> to download a file.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Main billing UI ──────────────────────────────────────────────────────
  return (
    <>
      <div id="receipt-print-root"></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, height: 'calc(100vh - 140px)' }}>

        {/* Left — Products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
          <div className="card" style={{ flexShrink: 0 }}>
            <div className="card-body" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
                  <i className="fa-solid fa-search"></i>
                  <input
                    className="form-control"
                    placeholder="Search product or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <select className="form-control" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} style={{ width: 160 }}>
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Category color map */}
          {(() => {
            const catColors = {
              'Beverages':          { bg: '#eff6ff', accent: '#3b82f6', text: '#1d4ed8' },
              'Bakery':             { bg: '#fffbeb', accent: '#f59e0b', text: '#b45309' },
              'Rice & Staples':     { bg: '#f0fdf4', accent: '#22c55e', text: '#15803d' },
              'Snacks':             { bg: '#fff7ed', accent: '#f97316', text: '#c2410c' },
              'Dairy':              { bg: '#faf5ff', accent: '#a855f7', text: '#7e22ce' },
              'Spices & Condiments':{ bg: '#fff1f2', accent: '#f43f5e', text: '#be123c' },
              'Medicine':           { bg: '#f0fdfa', accent: '#14b8a6', text: '#0f766e' },
              'Household':          { bg: '#f8fafc', accent: '#64748b', text: '#334155' },
            };
            const getColor = (cat) => catColors[cat] || { bg: '#f8fafc', accent: '#4f46e5', text: '#3730a3' };

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10, overflowY: 'auto', paddingRight: 4 }}>
                {filteredProducts.map((product) => {
                  const c = getColor(product.category);
                  const outOfStock = product.stock <= 0;
                  const lowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
                  return (
                    <div
                      key={product._id}
                      onClick={() => addToCart(product)}
                      style={{
                        background: outOfStock ? '#f8fafc' : c.bg,
                        border: `1.5px solid ${outOfStock ? '#e2e8f0' : c.accent}22`,
                        borderTop: `3px solid ${outOfStock ? '#cbd5e1' : c.accent}`,
                        borderRadius: 12,
                        padding: '12px 13px 11px',
                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                        opacity: outOfStock ? 0.55 : 1,
                        transition: 'transform 0.13s ease, box-shadow 0.13s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        userSelect: 'none',
                        filter: outOfStock ? 'grayscale(0.4)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!outOfStock) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 18px ${c.accent}30`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)';
                      }}
                      onMouseDown={(e) => { if (!outOfStock) e.currentTarget.style.transform = 'scale(0.97)'; }}
                      onMouseUp={(e) => { if (!outOfStock) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    >
                      {/* Top row: category dot + label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: outOfStock ? '#94a3b8' : c.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: outOfStock ? '#94a3b8' : c.text, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.category}
                        </span>
                      </div>

                      {/* Product name */}
                      <div style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1e293b',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}>
                        {product.name}
                      </div>

                      {/* Bottom row: price + stock */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: outOfStock ? '#94a3b8' : c.accent, letterSpacing: '-0.3px' }}>
                          {fmt(product.price)}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 20,
                          background: outOfStock ? '#e2e8f0' : lowStock ? '#fef3c7' : `${c.accent}18`,
                          color: outOfStock ? '#64748b' : lowStock ? '#92400e' : c.text,
                          border: `1px solid ${outOfStock ? '#cbd5e1' : lowStock ? '#fde68a' : `${c.accent}40`}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {outOfStock ? 'Out' : lowStock ? `⚠ ${product.stock}` : `${product.stock}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div style={{ gridColumn: '1/-1' }} className="empty-state">
                    <i className="fa-solid fa-box-open"></i>
                    <h3>No products found</h3>
                    <p>Try a different search or category</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right — Cart */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="card-header">
              <h3><i className="fa-solid fa-cart-shopping" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Cart ({cart.length})</h3>
              {cart.length > 0 && (
                <button className="btn btn-danger btn-sm" onClick={clearCart}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              )}
            </div>

            {error && (
              <div className="alert alert-danger" style={{ margin: '10px 16px 0' }}>
                <i className="fa-solid fa-circle-exclamation"></i>{error}
              </div>
            )}

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}>
                  <i className="fa-solid fa-cart-shopping"></i>
                  <h3>Cart is empty</h3>
                  <p>Click products to add them</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.product} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>{fmt(item.price)} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="btn btn-secondary btn-icon" style={{ width: 28, height: 28, padding: 0 }} onClick={() => updateQuantity(item.product, item.quantity - 1)}>
                      <i className="fa-solid fa-minus" style={{ fontSize: 11 }}></i>
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                    <button className="btn btn-secondary btn-icon" style={{ width: 28, height: 28, padding: 0 }} onClick={() => updateQuantity(item.product, item.quantity + 1)}>
                      <i className="fa-solid fa-plus" style={{ fontSize: 11 }}></i>
                    </button>
                  </div>
                  <div style={{ minWidth: 60, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(item.subtotal)}</div>
                  <button className="btn btn-danger btn-icon" style={{ width: 28, height: 28, padding: 0 }} onClick={() => removeFromCart(item.product)}>
                    <i className="fa-solid fa-xmark" style={{ fontSize: 11 }}></i>
                  </button>
                </div>
              ))}
            </div>

            {/* Order summary + checkout */}
            <div style={{ borderTop: '1px solid var(--border)', padding: 16, background: '#fafafa' }}>
              <div style={{ marginBottom: 12 }}>
                <select className="form-control" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>DISCOUNT ($)</label>
                  <input type="number" className="form-control" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} min="0" style={{ fontSize: 13 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>TAX (%)</label>
                  <input type="number" className="form-control" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min="0" style={{ fontSize: 13 }} />
                </div>
              </div>

              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-gray">Subtotal</span><span>{fmt(subtotal)}</span></div>
                {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-gray">Discount</span><span className="text-danger">-{fmt(discount)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-gray">Tax ({taxRate}%)</span><span>{fmt(taxAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span>Total</span><span style={{ color: 'var(--primary)' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['cash', 'card', 'qr'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      flex: 1, padding: '8px 4px',
                      border: `2px solid ${paymentMethod === method ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: paymentMethod === method ? 'var(--primary-light)' : '#fff',
                      color: paymentMethod === method ? 'var(--primary)' : 'var(--gray)',
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className={`fa-solid fa-${method === 'cash' ? 'money-bill' : method === 'card' ? 'credit-card' : 'qrcode'}`} style={{ fontSize: 16 }}></i>
                    {method.toUpperCase()}
                  </button>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: 12 }}>
                  <input type="number" className="form-control" placeholder="Amount paid" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} style={{ fontSize: 13 }} />
                  {change > 0 && (
                    <div style={{ marginTop: 6, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                      <i className="fa-solid fa-coins" style={{ marginRight: 6 }}></i>Change: {fmt(change)}
                    </div>
                  )}
                </div>
              )}

              <button className="btn btn-success w-100 btn-lg" onClick={handleCheckout} disabled={loading || cart.length === 0}>
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Processing...</>
                  : <><i className="fa-solid fa-check"></i> Complete Sale {fmt(total)}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
