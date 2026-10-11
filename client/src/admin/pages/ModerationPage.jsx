import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/adminApi';
import { DataTable } from '../components/ui/DataTable';
import { StatusPill } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { ConfirmDialog } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { ShieldAlert, CheckCircle } from 'lucide-react';

export default function ModerationPage() {
  const [data, setData] = useState({ reports: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionModal, setActionModal] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports({ status: activeTab, limit: 50 });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleAction = async (reason) => {
    if (!selectedReport || !actionModal) return;
    try {
      if (actionModal === 'resolve') {
        await adminAPI.resolveReport(selectedReport._id, { actionTaken: 'content_removed', resolutionNotes: reason });
      } else if (actionModal === 'dismiss') {
        await adminAPI.dismissReport(selectedReport._id, { resolutionNotes: reason });
      }
      setActionModal(null);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { 
      header: 'Target', 
      cell: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white capitalize">{row.targetType}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.targetId}</div>
        </div>
      )
    },
    { 
      header: 'Reason', 
      cell: (row) => (
        <div>
          <div className="text-sm text-slate-900 dark:text-white capitalize">{row.reason.replace('_', ' ')}</div>
          {row.details && <div className="text-[10px] text-slate-500 max-w-xs truncate">{row.details}</div>}
        </div>
      )
    },
    { 
      header: 'Reporter', 
      cell: (row) => row.reporter ? `@${row.reporter.username}` : 'System'
    },
    { 
      header: 'Status', 
      cell: (row) => <StatusPill status={row.status} />
    },
    { 
      header: 'Age', 
      cell: (row) => {
        const hours = Math.round((Date.now() - new Date(row.createdAt).getTime()) / (1000 * 60 * 60));
        return <span className={hours > 24 ? 'text-rose-500 font-bold' : ''}>{hours}h</span>
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Moderation Queue</h2>
        <p className="text-sm text-slate-500">Review flagged content and user reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-amber-500 mb-1">{activeTab === 'pending' ? data.total : '-'}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Reports</div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-emerald-500 mb-1">99.4%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Auto-Filtered</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <Card className="p-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Tabs 
            activeTab={activeTab} 
            onChange={setActiveTab}
            tabs={[
              { id: 'pending', label: 'Open' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'dismissed', label: 'Dismissed' }
            ]} 
          />
        </div>
        <DataTable 
          columns={columns} 
          data={data.reports} 
          loading={loading}
          onRowClick={(row) => {
            if (row.status === 'pending') {
              setSelectedReport(row);
              setActionModal('resolve');
            }
          }}
          emptyState={
            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
              <p className="font-bold text-lg">Queue is Empty</p>
              <p className="text-sm">No pending reports require attention.</p>
            </div>
          }
        />
      </Card>

      <ConfirmDialog
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={handleAction}
        title={actionModal === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
        message={actionModal === 'resolve' 
          ? `Are you sure you want to remove this ${selectedReport?.targetType} and penalize the user?` 
          : `Are you sure you want to dismiss this report? No action will be taken.`}
        requireReason={true}
        destructive={actionModal === 'resolve'}
        confirmText={actionModal === 'resolve' ? 'Remove Content' : 'Dismiss'}
      />
    </div>
  );
}
