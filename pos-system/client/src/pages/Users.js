import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'cashier' };

const ROLE_META = {
  admin:   { label: 'Admin',   color: '#7c3aed', bg: '#ede9fe', icon: 'fa-solid fa-shield-halved' },
  manager: { label: 'Manager', color: '#0369a1', bg: '#e0f2fe', icon: 'fa-solid fa-user-tie' },
  cashier: { label: 'Cashier', color: '#065f46', bg: '#d1fae5', icon: 'fa-solid fa-user' },
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowPassword(false);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Full name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (!editUser && !form.password) { setError('Password is required for new users'); return; }
    if (form.password && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setSaving(true);
    setError('');
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/auth/users/${editUser._id}`, payload);
      } else {
        await api.post('/auth/users', form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u) => {
    try {
      await api.patch(`/auth/users/${u._id}/toggle`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (u) => {
    try {
      await api.delete(`/auth/users/${u._id}`);
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    admin:   users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    cashier: users.filter(u => u.role === 'cashier').length,
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {Object.entries(ROLE_META).map(([role, meta]) => (
          <div className="stat-card" key={role} style={{ cursor: 'pointer', border: roleFilter === role ? `2px solid ${meta.color}` : undefined }} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
            <div className="stat-icon" style={{ background: meta.bg, color: meta.color }}>
              <i className={meta.icon}></i>
            </div>
            <div className="stat-info">
              <div className="label">{meta.label}s</div>
              <div className="value">{counts[role]}</div>
              <div className="sub">Active accounts</div>
            </div>
          </div>
        ))}
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fa-solid fa-users"></i></div>
          <div className="stat-info">
            <div className="label">Total Users</div>
            <div className="value">{users.length}</div>
            <div className="sub">{users.filter(u => u.isActive).length} active</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-between mb-24">
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ minWidth: 240 }}>
            <i className="fa-solid fa-search"></i>
            <input
              className="form-control"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 150 }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="fa-solid fa-user-plus"></i> Add User
        </button>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="card-header">
          <h3>
            <i className="fa-solid fa-users-gear" style={{ marginRight: 8, color: 'var(--primary)' }}></i>
            User Accounts ({filtered.length})
          </h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const meta = ROLE_META[u.role];
                  const isSelf = currentUser?.id === u._id;
                  return (
                    <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.55 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: meta.bg, color: meta.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 15, flexShrink: 0,
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {u.name}
                              {isSelf && (
                                <span style={{ fontSize: 11, color: 'var(--primary)', background: 'var(--primary-light)', padding: '1px 6px', borderRadius: 10, marginLeft: 8, fontWeight: 600 }}>
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--gray)' }}>{u.email}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: meta.bg, color: meta.color,
                        }}>
                          <i className={meta.icon} style={{ fontSize: 11 }}></i>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        {u.isActive
                          ? <span className="badge badge-success"><i className="fa-solid fa-circle" style={{ fontSize: 8, marginRight: 5 }}></i>Active</span>
                          : <span className="badge badge-danger"><i className="fa-solid fa-circle" style={{ fontSize: 8, marginRight: 5 }}></i>Inactive</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(u)}
                            title="Edit user"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggle(u)}
                            disabled={isSelf}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`fa-solid fa-${u.isActive ? 'ban' : 'check'}`}></i>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDelete(u)}
                            disabled={isSelf}
                            title="Delete user"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <i className="fa-solid fa-users"></i>
                        <h3>No users found</h3>
                        <p>Try a different search or add a new user</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Role permissions info */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3><i className="fa-solid fa-shield-halved" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Role Permissions</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {Object.entries(ROLE_META).map(([role, meta]) => (
              <div key={role} style={{ border: `1.5px solid ${meta.bg}`, borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={meta.icon}></i>
                  </div>
                  <span style={{ fontWeight: 700, color: meta.color }}>{meta.label}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, color: 'var(--gray)' }}>
                  {role === 'admin' && ['Full system access', 'Manage users', 'All reports', 'Settings', 'Products & inventory', 'Billing'].map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <i className="fa-solid fa-check" style={{ color: 'var(--success)', fontSize: 10 }}></i>{p}
                    </li>
                  ))}
                  {role === 'manager' && ['Reports & analytics', 'Products & inventory', 'Customers', 'Billing', 'Dashboard'].map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <i className="fa-solid fa-check" style={{ color: 'var(--success)', fontSize: 10 }}></i>{p}
                    </li>
                  ))}
                  {role === 'cashier' && ['Billing / sales', 'Customers', 'Dashboard (own sales)'].map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <i className="fa-solid fa-check" style={{ color: 'var(--success)', fontSize: 10 }}></i>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>
                <i className={`fa-solid fa-${editUser ? 'pen' : 'user-plus'}`} style={{ marginRight: 8, color: 'var(--primary)' }}></i>
                {editUser ? `Edit — ${editUser.name}` : 'Add New User'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="fa-solid fa-circle-exclamation"></i>{error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@store.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role *</label>
                <select
                  className="form-control"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="cashier">Cashier — billing only</option>
                  <option value="manager">Manager — products, inventory, reports</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editUser ? 'Leave blank to keep current password' : 'Min. 6 characters'}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontSize: 14 }}
                  >
                    <i className={`fa-solid fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
                {form.password && form.password.length < 6 && (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              {/* Role preview */}
              <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-sm)', padding: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray)', marginBottom: 8 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }}></i>
                  This user will have access to:
                </div>
                <div style={{ fontSize: 12, color: 'var(--dark)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.role === 'admin' && ['Dashboard', 'Billing', 'Products', 'Customers', 'Inventory', 'Reports', 'Settings', 'Users'].map(p => (
                    <span key={p} className="badge badge-primary">{p}</span>
                  ))}
                  {form.role === 'manager' && ['Dashboard', 'Billing', 'Products', 'Customers', 'Inventory', 'Reports'].map(p => (
                    <span key={p} className="badge badge-primary">{p}</span>
                  ))}
                  {form.role === 'cashier' && ['Dashboard', 'Billing', 'Customers'].map(p => (
                    <span key={p} className="badge badge-primary">{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? 'Saving...'
                  : <><i className={`fa-solid fa-${editUser ? 'check' : 'user-plus'}`}></i> {editUser ? 'Update User' : 'Create User'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8, color: 'var(--danger)' }}></i>Delete User</h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12 }}>
                Are you sure you want to permanently delete <strong>{confirmDelete.name}</strong>?
              </p>
              <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                This action cannot be undone. Their sales history will be preserved.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>
                <i className="fa-solid fa-trash"></i> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
