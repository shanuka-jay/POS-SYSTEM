import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err.response?.status, err.response?.data);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;
  const fmtDate = (d) => new Date(d).toLocaleString();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div> Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-danger">
          <i className="fa-solid fa-circle-exclamation"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={fetchDashboard}>
          <i className="fa-solid fa-rotate-right"></i> Retry
        </button>
      </div>
    );
  }

  const isCashier = user?.role === 'cashier';

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 24,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p style={{ opacity: 0.85, fontSize: 14 }}>
            {isCashier
              ? "Here's your personal sales summary."
              : "Here's what's happening at your store today."}
          </p>
        </div>
        <div style={{ fontSize: 48, opacity: 0.2 }}>
          <i className="fa-solid fa-store"></i>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fa-solid fa-dollar-sign"></i></div>
          <div className="stat-info">
            <div className="label">{isCashier ? "My Today's Sales" : "Today's Sales"}</div>
            <div className="value">{fmt(data?.todaySales?.total)}</div>
            <div className="sub">{data?.todaySales?.count || 0} transactions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-chart-line"></i></div>
          <div className="stat-info">
            <div className="label">{isCashier ? 'My Monthly Sales' : 'Monthly Sales'}</div>
            <div className="value">{fmt(data?.monthSales?.total)}</div>
            <div className="sub">{data?.monthSales?.count || 0} transactions</div>
          </div>
        </div>

        {!isCashier && (
          <>
            <div className="stat-card">
              <div className="stat-icon purple"><i className="fa-solid fa-box"></i></div>
              <div className="stat-info">
                <div className="label">Total Products</div>
                <div className="value">{data?.totalProducts || 0}</div>
                <div className="sub">Active items</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><i className="fa-solid fa-triangle-exclamation"></i></div>
              <div className="stat-info">
                <div className="label">Low Stock Alerts</div>
                <div className="value">{data?.lowStockProducts || 0}</div>
                <div className="sub">Items need restock</div>
              </div>
            </div>
          </>
        )}

        {isCashier && (
          <div className="stat-card">
            <div className="stat-icon purple"><i className="fa-solid fa-receipt"></i></div>
            <div className="stat-info">
              <div className="label">Avg Sale Value</div>
              <div className="value">
                {data?.todaySales?.count > 0
                  ? fmt(data.todaySales.total / data.todaySales.count)
                  : 'Rs. 0'}
              </div>
              <div className="sub">Today's average</div>
            </div>
          </div>
        )}
      </div>

      {/* Low stock warning for admin/manager */}
      {!isCashier && data?.lowStockProducts > 0 && (
        <div className="alert alert-warning mb-24">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <strong>{data.lowStockProducts} products</strong> are running low on stock. Visit Inventory to restock.
        </div>
      )}

      {/* Recent Transactions table */}
      <div className="card">
        <div className="card-header">
          <h3>
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8, color: 'var(--primary)' }}></i>
            {isCashier ? 'My Recent Transactions' : 'Recent Transactions'}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboard}>
            <i className="fa-solid fa-rotate-right"></i> Refresh
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Customer</th>
                {!isCashier && <th>Cashier</th>}
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSales?.length > 0 ? (
                data.recentSales.map((sale) => (
                  <tr key={sale._id}>
                    <td><span className="badge badge-primary">{sale.saleNumber}</span></td>
                    <td>{sale.customer?.name || <span className="text-gray">Walk-in</span>}</td>
                    {!isCashier && <td>{sale.cashier?.name}</td>}
                    <td>{sale.items?.length || 0}</td>
                    <td><strong>{fmt(sale.total)}</strong></td>
                    <td>
                      <span className={`badge ${
                        sale.paymentMethod === 'cash' ? 'badge-success'
                        : sale.paymentMethod === 'card' ? 'badge-primary'
                        : 'badge-warning'
                      }`}>
                        <i className={`fa-solid fa-${
                          sale.paymentMethod === 'cash' ? 'money-bill'
                          : sale.paymentMethod === 'card' ? 'credit-card'
                          : 'qrcode'
                        }`} style={{ marginRight: 4 }}></i>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="text-gray" style={{ fontSize: 12 }}>{fmtDate(sale.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isCashier ? 6 : 7}>
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                      <i className="fa-solid fa-receipt"></i>
                      <h3>No transactions yet</h3>
                      <p>{isCashier
                        ? 'Complete a sale in Billing to see it here.'
                        : 'No sales have been recorded yet.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

