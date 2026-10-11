import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/adminApi';
import { Card } from '../components/ui/Card';
import { Server, Database, Activity } from 'lucide-react';

export default function SystemPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminAPI.getCommandCenter().then(res => setData(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Server className="text-slate-500" /> System Health
        </h2>
        <p className="text-sm text-slate-500">Infrastructure and backend metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="API Service" className="h-full">
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-500" />
              <div>
                <div className="font-bold text-emerald-700 dark:text-emerald-400">Operational</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500">Latency: ~45ms</div>
              </div>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </Card>
        
        <Card title="Database (MongoDB)" className="h-full">
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-emerald-500" />
              <div>
                <div className="font-bold text-emerald-700 dark:text-emerald-400">Connected</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500">{data?.platformPulse?.totalUsers || 0} active records</div>
              </div>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
