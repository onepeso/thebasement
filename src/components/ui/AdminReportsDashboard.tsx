import { useState, useEffect } from 'react';
import { X, Shield, Check, XCircle, Eye, AlertTriangle, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  content_snapshot: string;
  message_id: string;
  channel_id: string;
  status: string;
  created_at: string;
  reporter_name: string;
  reported_name: string;
}

interface AdminReportsDashboardProps {
  onClose: () => void;
}

export function AdminReportsDashboard({ onClose }: AdminReportsDashboardProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) return;

      const res = await fetch('/api/report', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const { reports: data } = await res.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, action: 'dismiss' | 'resolve' | 'review') => {
    setActionLoading(reportId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) return;

      const res = await fetch('/api/report', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ report_id: reportId, action }),
      });
      
      if (res.ok) {
        setReports(prev => prev.map(r => 
          r.id === reportId ? { ...r, status: action === 'dismiss' ? 'dismissed' : action === 'resolve' ? 'resolved' : 'reviewed' } : r
        ));
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('Error updating report:', err);
    }
    setActionLoading(null);
  };

  const filteredReports = filter === 'pending' 
    ? reports.filter(r => r.status === 'pending')
    : reports;

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    reviewed: 'text-blue-400 bg-blue-400/10',
    resolved: 'text-green-400 bg-green-400/10',
    dismissed: 'text-zinc-400 bg-zinc-400/10',
  };

  const reasonLabels: Record<string, string> = {
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    spam: 'Spam',
    inappropriate: 'Inappropriate',
    other: 'Other',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-red-400" />
            <h2 className="text-sm font-bold text-white">Admin: Reports Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'pending' 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({reports.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <AlertTriangle size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No {filter === 'pending' ? 'pending ' : ''}reports</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[report.status]}`}>
                          {report.status}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-500/10 text-red-400">
                          {reasonLabels[report.reason] || report.reason}
                        </span>
                      </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                    <User size={10} />
                    <span>{report.reported_name || report.reported_id || 'Unknown'}</span>
                    <span className="text-zinc-600">reported by</span>
                    <span>{report.reporter_name || report.reporter_id || 'Unknown'}</span>
                  </div>
                  {report.content_snapshot && (
                    <p className="text-xs text-zinc-500 truncate">
                      "{report.content_snapshot}"
                    </p>
                  )}
                    </div>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReport && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[210]" 
            onClick={() => setSelectedReport(null)}
          >
            <div 
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl p-4" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h3 className="text-sm font-bold text-white">Report Details</h3>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-white/10 rounded">
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Status</span>
                  <p className={`inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selectedReport.status]}`}>
                    {selectedReport.status}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Reason</span>
                  <p className="text-sm text-white">{reasonLabels[selectedReport.reason] || selectedReport.reason}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Reported User</span>
                  <p className="text-sm text-white">{selectedReport.reported_name || selectedReport.reported_id || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Reported By</span>
                  <p className="text-sm text-white">{selectedReport.reporter_name || selectedReport.reporter_id || 'Unknown'}</p>
                </div>
                {selectedReport.content_snapshot && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                      <MessageSquare size={10} /> Message Content
                    </span>
                    <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-2 mt-1 break-words">
                      {selectedReport.content_snapshot}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Created</span>
                  <p className="text-xs text-zinc-400">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(selectedReport.id, 'dismiss')}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                  >
                    <XCircle size={12} />
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleAction(selectedReport.id, 'review')}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Eye size={12} />
                    Reviewing
                  </button>
                  <button
                    onClick={() => handleAction(selectedReport.id, 'resolve')}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Check size={12} />
                    Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
