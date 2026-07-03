import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  timestamp: string;
}

export default function AdminActivityLog() {
  const { role } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) return;

    const qLogs = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(50) // Show more logs on the dedicated page
    );

    const unsubscribe = onSnapshot(qLogs, (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setActivityLogs(logs);
      setLoading(false);
    }, (error) => {
      console.error('Failed to load activity logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  if (!['admin', 'admin_approver', 'it_approver'].includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Printed': return <Badge variant="info">Printed</Badge>;
      case 'Distributed': return <Badge variant="purple">Distributed</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'Draft': return <Badge variant="draft">Draft</Badge>;
      default: return <Badge variant="warning">{status || 'Pending'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Log</h1>
          <p className="text-slate-500 mt-1">Detailed history of administrative actions</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200/60">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Administrative Activity</CardTitle>
              <CardDescription className="mt-1">Approvals, rejections, and status change events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading activity...</div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No recent activity found</div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600">
                      {log.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-slate-900">{log.userName}</span>
                        <span className="text-slate-500"> marked</span>
                        <span className="font-medium text-slate-700"> {log.resourceName}</span> ({log.resourceType})
                        <span className="text-slate-500"> as</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400">{format(new Date(log.timestamp), 'MMM d, yyyy - h:mm a')}</p>
                        <span className="text-slate-300 mx-1">•</span>
                        <p className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-xs">{log.userEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 sm:min-w-[100px] sm:text-right">
                    {getStatusBadge(log.action)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
