import React from 'react';
import { Card, StatCard } from '../components/ui/Card';
import { TrendingUp, Users, Layout } from 'lucide-react';
import { Sparkline } from '../components/ui/Charts';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-blue-500" /> Platform Impact
        </h2>
        <p className="text-sm text-slate-500">Read-only overview of platform success metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Overall Impact Score" 
          value="842" 
          delta={12} 
          icon={<TrendingUp />} 
          color="blue"
          sparklineData={[1, 3, 2, 5, 4, 7, 6, 9]}
        />
        <StatCard 
          title="Network Effect" 
          value="3.2x" 
          delta={5} 
          icon={<Users />} 
          color="indigo"
          tooltip="Average number of new connections per user per week"
        />
        <StatCard 
          title="Knowledge Sharing" 
          value="1.2k" 
          delta={-2} 
          icon={<Layout />} 
          color="emerald"
        />
      </div>

      <Card title="Funnel & Distribution">
        <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Charts Module Pending Live Data Integration</p>
        </div>
      </Card>
    </div>
  );
}
