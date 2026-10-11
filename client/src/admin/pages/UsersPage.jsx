import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/adminApi';
import { DataTable } from '../components/ui/DataTable';
import { StatusPill } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { ConfirmDialog } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';

export default function UsersPage() {
  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'suspend' | 'verify'

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 20 });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleAction = async (reason) => {
    if (!selectedUser || !actionModal) return;
    try {
      if (actionModal === 'suspend') {
        await adminAPI.updateUserStatus(selectedUser._id, { status: 'suspended', reason });
      } else if (actionModal === 'verify') {
        await adminAPI.verifyCompany(selectedUser._id, { verified: true, reason });
      }
      setActionModal(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { 
      header: 'User', 
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.avatarUrl || `https://ui-avatars.com/api/?name=${row.username}`} className="w-8 h-8 rounded-full bg-slate-200" alt="" />
          <div>
            <div className="font-bold text-slate-900 dark:text-white">{row.fullName}</div>
            <div className="text-[10px] text-slate-500">@{row.username}</div>
          </div>
        </div>
      )
    },
    { header: 'Role', accessorKey: 'role' },
    { 
      header: 'Status', 
      cell: (row) => <StatusPill status={row.status || 'Active'} />
    },
    { header: 'Reputation', accessorKey: 'reputation' },
    { 
      header: 'Joined', 
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">User Intelligence</h2>
          <p className="text-sm text-slate-500">Manage platform accounts and roles.</p>
        </div>
        <button 
          onClick={() => {
            adminAPI.exportUsersCSV().then(res => {
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'users_export.csv');
              document.body.appendChild(link);
              link.click();
            });
          }}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
        >
          Export CSV
        </button>
      </div>

      <Card className="p-0">
        <DataTable 
          columns={columns} 
          data={data.users} 
          loading={loading}
          pagination={{ page, pages: data.pages, setPage }}
          onRowClick={(row) => setSelectedUser(row)}
        />
      </Card>

      <Drawer isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Profile">
        {selectedUser && (
          <div className="space-y-6">
            <div className="text-center">
              <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.username}`} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-100 dark:border-slate-800" alt="" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedUser.fullName}</h3>
              <p className="text-slate-500">@{selectedUser.username}</p>
              <div className="mt-2 flex justify-center gap-2">
                <StatusPill status={selectedUser.status || 'Active'} />
                <StatusPill status={selectedUser.role} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
                <div className="text-2xl font-black text-amber-500">{selectedUser.reputation || 0}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reputation</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
                <div className="text-2xl font-black text-blue-500">{selectedUser.followers?.length || 0}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Followers</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Actions</h4>
              <button 
                onClick={() => setActionModal('verify')}
                className="w-full text-left px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold transition-colors text-sm"
              >
                Verify Account (Company/Pro)
              </button>
              <button 
                onClick={() => setActionModal('suspend')}
                className="w-full text-left px-4 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-colors text-sm"
              >
                Suspend Account
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={handleAction}
        title={actionModal === 'suspend' ? 'Suspend User' : 'Verify Account'}
        message={`Are you sure you want to ${actionModal} @${selectedUser?.username}?`}
        requireReason={true}
        destructive={actionModal === 'suspend'}
        confirmText={actionModal === 'suspend' ? 'Suspend' : 'Verify'}
      />
    </div>
  );
}
