import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/adminApi';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { StatusPill } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/Modal';
import { ShieldAlert, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminsPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoteModal, setDemoteModal] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [admRes, actRes] = await Promise.all([
        adminAPI.getAdmins(),
        adminAPI.getActions()
      ]);
      setAdmins(admRes.data.admins || []);
      setActions(actRes.data.actions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDemote = async () => {
    if (!demoteModal) return;
    try {
      await adminAPI.demote(demoteModal._id);
      setDemoteModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-rose-500" /> Admins & Audit
        </h2>
        <p className="text-sm text-slate-500">Manage administrator privileges and review system logs.</p>
      </div>

      <Card title="Current Administrators">
        <DataTable 
          loading={loading}
          data={admins}
          columns={[
            { header: 'Admin', cell: row => (
              <div className="flex items-center gap-2">
                <span className="font-bold">{row.fullName}</span>
                {row._id === currentUser?._id && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">You</span>}
              </div>
            )},
            { header: 'Username', cell: row => `@${row.username}` },
            { header: 'Status', cell: row => <StatusPill status={row.mustChangePassword ? 'Pending' : 'Active'} /> },
            { header: 'Actions', cell: row => (
              row._id !== currentUser?._id && (
                <button 
                  onClick={() => setDemoteModal(row)}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors"
                >
                  Demote
                </button>
              )
            )}
          ]}
        />
      </Card>

      <Card title="Audit Log (Recent Actions)">
        <DataTable 
          loading={loading}
          data={actions}
          columns={[
            { header: 'Admin', cell: row => row.admin ? `@${row.admin.username}` : 'System' },
            { header: 'Action', cell: row => <span className="uppercase text-xs font-bold text-slate-500">{row.action}</span> },
            { header: 'Details', cell: row => <span className="text-sm">{row.details}</span> },
            { header: 'Time', cell: row => <span className="text-xs text-slate-400">{new Date(row.createdAt).toLocaleString()}</span> }
          ]}
        />
      </Card>

      <ConfirmDialog
        isOpen={!!demoteModal}
        onClose={() => setDemoteModal(null)}
        onConfirm={handleDemote}
        title="Demote Administrator"
        message={`Are you sure you want to revoke admin privileges for @${demoteModal?.username}?`}
        destructive={true}
        confirmText="Demote User"
      />
    </div>
  );
}
