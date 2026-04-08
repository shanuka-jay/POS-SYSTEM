import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'fa-solid fa-chart-pie', roles: ['admin', 'manager', 'cashier'] },
  { path: '/billing', label: 'Billing', icon: 'fa-solid fa-cash-register', roles: ['admin', 'manager', 'cashier'] },
  { path: '/products', label: 'Products', icon: 'fa-solid fa-box', roles: ['admin', 'manager'] },
  { path: '/customers', label: 'Customers', icon: 'fa-solid fa-users', roles: ['admin', 'manager', 'cashier'] },
  { path: '/inventory', label: 'Inventory', icon: 'fa-solid fa-warehouse', roles: ['admin', 'manager'] },
  { path: '/reports', label: 'Reports', icon: 'fa-solid fa-chart-bar', roles: ['admin', 'manager'] },
  { path: '/users', label: 'Users', icon: 'fa-solid fa-users-gear', roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: 'fa-solid fa-gear', roles: ['admin'] },
];

const pageTitles = {
  '/': 'Dashboard',
  '/billing': 'Billing',
  '/products': 'Products',
  '/customers': 'Customers',
  '/inventory': 'Inventory',
  '/reports': 'Reports & Analytics',
  '/users': 'User Management',
  '/settings': 'Settings',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));
  const currentTitle = pageTitles[location.pathname] || 'POS System';

  return (
    <div className="layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <i className="fa-solid fa-store"></i>
          </div>
          <div className="logo-text">
            <h2>QuickPOS</h2>
            <span>Point of Sale</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={item.icon}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button className="logout-btn" title="Logout">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        {!isOnline && (
          <div className="offline-banner">
            <i className="fa-solid fa-wifi-slash"></i>
            You are offline. Cart data is being saved locally.
          </div>
        )}
        <header className="topbar">
          <div className="topbar-left">
            <h1>{currentTitle}</h1>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="topbar-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isOnline ? 'var(--success)' : 'var(--warning)' }}>
              <i className={`fa-solid fa-circle`} style={{ fontSize: 8 }}></i>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ display: 'none' }} onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

