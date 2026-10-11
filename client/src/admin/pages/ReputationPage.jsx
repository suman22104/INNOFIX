import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/adminApi';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Zap } from 'lucide-react';

export default function ReputationPage() {
  const [data, setData] = useState([]);
  
  // This would ideally fetch from a new endpoint, but for now we mock it
  // or fetch from users endpoint sorting by reputation.
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="text-amber-500" /> Reputation Control
        </h2>
        <p className="text-sm text-slate-500">Monitor and adjust the gamification mechanics.</p>
      </div>

      <Card title="Scoring Rules">
        <DataTable 
          data={[
            { action: 'Create Post', points: 5 },
            { action: 'Receive Like', points: 1 },
            { action: 'Join Project', points: 20 },
            { action: 'Project Milestone', points: 50 },
          ]}
          columns={[
            { header: 'Action', accessorKey: 'action' },
            { header: 'Points', accessorKey: 'points' }
          ]}
        />
      </Card>
    </div>
  );
}
