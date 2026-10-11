import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/adminApi';
import { Card, StatCard } from '../components/ui/Card';
import { HeatStrip } from '../components/ui/Charts';
import { Skeleton } from '../components/ui/Skeleton';
import { Users, Layout, Briefcase, Globe2, AlertCircle, Activity, Clock } from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCommandCenter();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const handleRefresh = () => fetchOverview();
    window.addEventListener('admin-refresh', handleRefresh);
    return () => window.removeEventListener('admin-refresh', handleRefresh);
  }, []);

  if (loading && !data) {
    return <div className="space-y-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>;
  }

  const { platformPulse, priorityAlerts, activityFeed } = data || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Mission Control</h2>
        <p className="text-sm text-slate-500">Real-time visibility into the INNOFIX ecosystem.</p>
      </div>

      {priorityAlerts && priorityAlerts.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm uppercase tracking-widest">
            <AlertCircle className="w-4 h-4" /> Needs Your Attention
          </div>
          <div className="space-y-2">
            {priorityAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm text-sm border border-slate-100 dark:border-slate-800">
                <span className="font-medium">{alert.message}</span>
                <span className="text-slate-400 text-xs">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Users" 
          value={platformPulse?.totalUsers || 0} 
          icon={<Users />} 
          color="blue"
        />
        <StatCard 
          title="Projects" 
          value={platformPulse?.totalProjects || 0} 
          icon={<Layout />} 
          color="indigo"
        />
        <StatCard 
          title="Opportunities" 
          value={platformPulse?.totalOpportunities || 0} 
          icon={<Briefcase />} 
          color="amber"
        />
        <StatCard 
          title="Communities" 
          value={platformPulse?.totalCommunities || 0} 
          icon={<Globe2 />} 
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          <Card title={<span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Live Platform Activity</span>}>
            <div className="space-y-4">
              {activityFeed?.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full ${
                    item.status === 'success' ? 'bg-emerald-500' :
                    item.status === 'info' ? 'bg-blue-500' :
                    item.status === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!activityFeed || activityFeed.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card title="Platform Heat" className="h-full">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <span>Signups (30d)</span>
                  <span className="text-slate-900 dark:text-white">Warm</span>
                </div>
                <HeatStrip data={[...Array(30)].map(() => ({ value: Math.floor(Math.random() * 5) }))} />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <span>Posts (30d)</span>
                  <span className="text-slate-900 dark:text-white">Active</span>
                </div>
                <HeatStrip data={[...Array(30)].map(() => ({ value: Math.floor(Math.random() * 5) }))} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
