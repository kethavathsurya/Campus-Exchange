import React, { useEffect, useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ContentReport } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminModeration: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    api.getAdminReports()
      .then((res) => setReports(res.reports))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const handleActionReport = async (id: string, status: 'DISMISSED' | 'ACTIONED') => {
    try {
      await api.actionAdminReport(id, { status, notes: `Admin marked as ${status}` });
      fetchReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this listing as Admin?')) return;
    try {
      await api.adminRemoveListing(listingId, 'Admin removed reported content');
      alert('Listing removed!');
      fetchReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-red-600 font-bold space-y-2">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2>Access Denied</h2>
        <p className="text-xs text-gray-500 font-normal">Administrator privileges are required to access Moderation tools.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3 bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Campus Moderation Center</h1>
          <p className="text-xs text-amber-800">Review reported listings, content flags & audit moderation actions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 font-bold text-gray-900 text-sm">
          Content Report Queue ({reports.length})
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading moderation reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">No content reports pending moderation review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Reported By</th>
                  <th className="p-3.5">Target Type</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-medium text-gray-900">{r.reporter?.name || r.reporterId}</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-semibold">{r.contentType}</span></td>
                    <td className="p-3.5 font-bold text-amber-700">{r.reason}</td>
                    <td className="p-3.5 max-w-xs truncate">{r.details || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {r.contentType === 'LISTING' && (
                        <button
                          onClick={() => handleRemoveListing(r.targetId)}
                          className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700"
                        >
                          Remove Content
                        </button>
                      )}
                      <button
                        onClick={() => handleActionReport(r.id, 'DISMISSED')}
                        className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded text-[11px] font-semibold hover:bg-gray-300"
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
