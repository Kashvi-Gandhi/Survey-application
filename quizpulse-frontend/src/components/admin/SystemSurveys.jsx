import React, { useEffect, useState } from 'react';
import { BarChart3, Check, Pencil, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSystemSurveys, updateSystemSurvey, updateSystemSurveyStatus } from '../../services/adminService';

const statusStyles = { DRAFT: 'bg-amber-100 text-amber-800', ACTIVE: 'bg-emerald-100 text-emerald-800', CLOSED: 'bg-red-100 text-red-800', ARCHIVED: 'bg-slate-200 text-slate-700' };

export default function SystemSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ title: '', description: '' });

  const loadSurveys = async () => {
    setLoading(true); setError('');
    try { const response = await getSystemSurveys(); setSurveys(response.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load system surveys.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadSurveys(); }, []);

  const handleStatusChange = async (survey, status) => {
    if (status === survey.status) return;
    try { setUpdatingId(survey.id); await updateSystemSurveyStatus(survey.id, status); setSurveys((items) => items.map((item) => item.id === survey.id ? { ...item, status } : item)); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update survey status.'); }
    finally { setUpdatingId(null); }
  };
  const startEdit = (survey) => { setError(''); setEditingId(survey.id); setEditValues({ title: survey.title || '', description: survey.description || '' }); };
  const cancelEdit = () => { setEditingId(null); setEditValues({ title: '', description: '' }); };
  const saveEdit = async (surveyId) => {
    if (!editValues.title.trim()) { setError('Survey title is required.'); return; }
    try {
      setUpdatingId(surveyId);
      await updateSystemSurvey(surveyId, { title: editValues.title.trim(), description: editValues.description.trim() });
      setSurveys((items) => items.map((item) => item.id === surveyId ? { ...item, title: editValues.title.trim(), description: editValues.description.trim() } : item));
      cancelEdit();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update survey.'); }
    finally { setUpdatingId(null); }
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">System Surveys</h2><p className="text-sm text-slate-500">Moderate lifecycle status and inspect results across all creators.</p></div><button onClick={loadSurveys} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button></div>
    {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{error}</div>}
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {loading ? <div className="p-10 text-center text-sm text-slate-400">Loading system surveys...</div> : surveys.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">No system surveys found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px]"><thead className="bg-slate-50 border-b border-slate-200"><tr>{['Survey', 'Creator', 'Created', 'Responses', 'Status', 'Moderation', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{surveys.map((survey) => {
        const responseCount = Number(survey.response_count) || 0; const status = String(survey.status || 'DRAFT').toUpperCase(); const isEditing = editingId === survey.id;
        return <tr key={survey.id} className="hover:bg-slate-50"><td className="px-4 py-3">{isEditing ? <div className="space-y-2"><input value={editValues.title} onChange={(event) => setEditValues({ ...editValues, title: event.target.value })} aria-label="Survey title" className="w-full px-2 py-1 text-sm border border-indigo-300 rounded" /><textarea value={editValues.description} onChange={(event) => setEditValues({ ...editValues, description: event.target.value })} aria-label="Survey description" rows="2" className="w-full px-2 py-1 text-xs border border-indigo-300 rounded" /></div> : <><p className="text-sm font-semibold text-slate-900">{survey.title}</p><p className="text-xs text-slate-500">{survey.description || 'No description'}</p></>}</td><td className="px-4 py-3 text-sm text-slate-700"><p>{survey.owner_name || 'Unknown'}</p><p className="text-xs text-slate-500">{survey.owner_email}</p></td><td className="px-4 py-3 text-sm text-slate-600">{survey.created_at ? new Date(survey.created_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{responseCount}</td><td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${statusStyles[status] || statusStyles.DRAFT}`}>{status}</span></td><td className="px-4 py-3"><select value={status} onChange={(event) => handleStatusChange(survey, event.target.value)} disabled={updatingId === survey.id} className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white disabled:opacity-50"><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option><option value="CLOSED">CLOSED</option><option value="ARCHIVED">ARCHIVED</option></select></td><td className="px-4 py-3"><div className="flex gap-2">{!isEditing && <Link to={`/analytics/${survey.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50"><BarChart3 className="w-3.5 h-3.5" /> Analytics</Link>}{responseCount > 0 ? <button disabled title="Cannot edit survey with existing responses" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-400 border border-slate-200 rounded cursor-not-allowed"><Pencil className="w-3.5 h-3.5" /> Edit</button> : isEditing ? <><button onClick={() => saveEdit(survey.id)} disabled={updatingId === survey.id} title="Save changes" className="p-1.5 text-emerald-700 border border-emerald-200 rounded"><Check className="w-4 h-4" /></button><button onClick={cancelEdit} disabled={updatingId === survey.id} title="Cancel editing" className="p-1.5 text-slate-600 border rounded"><X className="w-4 h-4" /></button></> : <button onClick={() => startEdit(survey)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" /> Edit</button>}</div></td></tr>;
      })}</tbody></table></div>}
    </div>
  </div>;
}
