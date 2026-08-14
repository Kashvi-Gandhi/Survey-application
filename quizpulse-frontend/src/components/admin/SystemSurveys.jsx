import React, { useEffect, useState } from 'react';
import { BarChart3, Pencil, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSystemSurveys, updateSystemSurveyStatus } from '../../services/adminService';

const statusStyles = {
  DRAFT: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-slate-200 text-slate-700'
};

export default function SystemSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadSurveys = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSystemSurveys();
      setSurveys(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system surveys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSurveys(); }, []);

  const handleStatusChange = async (survey, status) => {
    if (status === survey.status) return;
    try {
      setUpdatingId(survey.id);
      await updateSystemSurveyStatus(survey.id, status);
      setSurveys((current) => current.map((item) => item.id === survey.id ? { ...item, status } : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update survey status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">System Surveys</h2><p className="text-sm text-slate-500">Moderate lifecycle status and inspect results across all creators.</p></div><button onClick={loadSurveys} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button></div>
      {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{error}</div>}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-10 text-center text-sm text-slate-400">Loading system surveys...</div> : surveys.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">No system surveys found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px]"><thead className="bg-slate-50 border-b border-slate-200"><tr>{['Survey', 'Creator', 'Created', 'Responses', 'Status', 'Moderation', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{surveys.map((survey) => { const responseCount = Number(survey.response_count) || 0; const status = String(survey.status || 'DRAFT').toUpperCase(); return <tr key={survey.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="text-sm font-semibold text-slate-900">{survey.title}</p><p className="text-xs text-slate-500">{survey.description || 'No description'}</p></td><td className="px-4 py-3 text-sm text-slate-700"><p>{survey.owner_name || 'Unknown'}</p><p className="text-xs text-slate-500">{survey.owner_email}</p></td><td className="px-4 py-3 text-sm text-slate-600">{survey.created_at ? new Date(survey.created_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{responseCount}</td><td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${statusStyles[status] || statusStyles.DRAFT}`}>{status}</span></td><td className="px-4 py-3"><select value={['ACTIVE', 'CLOSED', 'ARCHIVED'].includes(status) ? status : ''} onChange={(event) => handleStatusChange(survey, event.target.value)} disabled={updatingId === survey.id} className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white disabled:opacity-50"><option value="" disabled>{status === 'DRAFT' ? 'Choose status' : 'Set status'}</option><option value="ACTIVE">ACTIVE</option><option value="CLOSED">CLOSED</option><option value="ARCHIVED">ARCHIVED</option></select></td><td className="px-4 py-3"><div className="flex gap-2"><Link to={`/analytics/${survey.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50"><BarChart3 className="w-3.5 h-3.5" /> Results</Link>{responseCount > 0 ? <button disabled title="Cannot edit survey with existing responses" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-400 border border-slate-200 rounded cursor-not-allowed"><Pencil className="w-3.5 h-3.5" /> Edit</button> : <Link to={`/surveys/${survey.id}/edit`} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" /> Edit</Link>}</div></td></tr>; })}</tbody></table></div>}
      </div>
    </div>
  );
}
