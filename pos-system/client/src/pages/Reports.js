import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchReport(); }, [view, selectedDate, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (view === 'daily') {
        const res = await api.get(`/reports/daily?date=${selectedDate}`);
        setData({ type: 'daily', ...res.data });
      } else {
        const res = await api.get(`/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
        setData({ type: 'monthly', ...res.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => ` Rs. ${Math.round(ctx.raw || 0).toLocaleString()}` } } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => `Rs. ${Math.round(v).toLocaleString()}` } } },
  };

  const buildDailyChart = () => {
    if (!data?.sales) return null;
    const byHour = {};
    data.sales.forEach((s) => {
      const h = new Date(s.createdAt).getHours();
      byHour[h] = (byHour[h] || 0) + s.total;
    });
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    return {
      labels,
      datasets: [{ label: 'Sales by Hour', data: labels.map((_, i) => byHour[i] || 0), backgroundColor: 'rgba(79, 70, 229, 0.7)', borderRadius: 6 }],
    };
  };

  const buildMonthlyChart = () => {
    if (!data?.dailyData) return null;
    const days = data.dailyData.map((d) => `${d._id.day}/${d._id.month}`);
    return {
      labels: days,
      datasets: [{ label: 'Daily Sales', data: data.dailyData.map((d) => d.totalSales), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)', fill: true, tension: 0.4, pointRadius: 4 }],
    };
  };

  const buildPaymentChart = () => {
    if (!data?.sales && !data?.type) return null;
    const sales = data.sales || [];
    const payMap = { cash: 0, card: 0, qr: 0 };
    sales.forEach((s) => { payMap[s.paymentMethod] = (payMap[s.paymentMethod] || 0) + s.total; });
    return {
      labels: ['Cash', 'Card', 'QR'],
      datasets: [{ data: [payMap.cash, payMap.card, payMap.qr], backgroundColor: ['#10b981', '#4f46e5', '#f59e0b'], borderWidth: 0 }],
    };
  };

  return (
    <div>
      {/* Controls */}
      <div className="card mb-24">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`btn ${view === 'daily' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('daily')}><i className="fa-solid fa-calendar-day"></i> Daily</button>
              <button className={`btn ${view === 'monthly' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('monthly')}><i className="fa-solid fa-calendar"></i> Monthly</button>
            </div>
            {view === 'daily' && (
              <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: 180 }} />
            )}
            {view === 'monthly' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: 130 }}>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select className="form-control" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: 100 }}>
                  {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
            <button className="btn btn-outline btn-sm" onClick={fetchReport}><i className="fa-solid fa-rotate-right"></i> Refresh</button>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner"></div> Loading report...</div> : data && (
        <>
          {/* Summary Stats */}
          <div className="stats-grid mb-24">
            <div className="stat-card">
              <div className="stat-icon blue"><i className="fa-solid fa-dollar-sign"></i></div>
              <div className="stat-info"><div className="label">Total Sales</div><div className="value">{fmt(data.summary?.totalSales)}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><i className="fa-solid fa-receipt"></i></div>
              <div className="stat-info"><div className="label">Transactions</div><div className="value">{data.summary?.transactions || 0}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><i className="fa-solid fa-tag"></i></div>
              <div className="stat-info"><div className="label">Avg Transaction</div><div className="value">{fmt(data.summary?.avgTransaction)}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><i className="fa-solid fa-percent"></i></div>
              <div className="stat-info"><div className="label">Tax Collected</div><div className="value">{fmt(data.summary?.totalTax)}</div></div>
            </div>
          </div>

          {/* Charts */}
          <div className="row mb-24">
            <div style={{ flex: 2, minWidth: 0 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
                  <i className="fa-solid fa-chart-bar" style={{ marginRight: 8, color: 'var(--primary)' }}></i>
                  {view === 'daily' ? 'Sales by Hour' : 'Daily Sales Trend'}
                </h3>
                {view === 'daily' && buildDailyChart() ? (
                  <Bar data={buildDailyChart()} options={chartOptions} />
                ) : view === 'monthly' && buildMonthlyChart() ? (
                  <Line data={buildMonthlyChart()} options={{ ...chartOptions, scales: { y: { beginAtZero: true, ticks: { callback: (v) => `Rs. ${Math.round(v).toLocaleString()}` } } } }} />
                ) : (
                  <div className="empty-state"><i className="fa-solid fa-chart-bar"></i><h3>No chart data</h3></div>
                )}
              </div>
            </div>
            {data.type === 'daily' && buildPaymentChart() && (
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
                    <i className="fa-solid fa-credit-card" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Payment Methods
                  </h3>
                  <Doughnut data={buildPaymentChart()} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Top Products */}
          {data.topProducts && data.topProducts.length > 0 && (
            <div className="card mb-24">
              <div className="card-header">
                <h3><i className="fa-solid fa-star" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Top Products</h3>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Rank</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? ['#fbbf24','#94a3b8','#cd7c2f'][i] : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i < 3 ? '#fff' : 'var(--gray)' }}>
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-primary">{p.totalQuantity} units</span></td>
                        <td><strong>{fmt(p.totalRevenue)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales List (daily only) */}
          {data.type === 'daily' && data.sales && (
            <div className="card">
              <div className="card-header">
                <h3><i className="fa-solid fa-list" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Transactions ({data.sales.length})</h3>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Sale #</th><th>Time</th><th>Customer</th><th>Cashier</th><th>Items</th><th>Total</th><th>Payment</th></tr>
                  </thead>
                  <tbody>
                    {data.sales.length === 0 ? (
                      <tr><td colSpan="7"><div className="empty-state"><i className="fa-solid fa-receipt"></i><h3>No sales for this date</h3></div></td></tr>
                    ) : data.sales.map((s) => (
                      <tr key={s._id}>
                        <td><span className="badge badge-primary">{s.saleNumber}</span></td>
                        <td style={{ fontSize: 12 }}>{new Date(s.createdAt).toLocaleTimeString()}</td>
                        <td>{s.customer?.name || <span className="text-gray">Walk-in</span>}</td>
                        <td>{s.cashier?.name}</td>
                        <td>{s.items?.length}</td>
                        <td><strong>{fmt(s.total)}</strong></td>
                        <td><span className="badge badge-gray">{s.paymentMethod}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

