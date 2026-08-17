import React, { useEffect, useState } from 'react';
import { BarChart3, BookOpen, ClipboardList, FileText, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { getAdminMetrics, getAdminSurveyors, updateSurveyorStatus } from '../services/adminService';
import SystemSurveys from '../components/admin/SystemSurveys';

const tabs = [
  { id: 'overview', label: 'Overview & Surveyors' },
  { id: 'surveys', label: 'System Surveys' }
];

const isActiveSurveyor = (surveyor) => surveyor.is_active === true || Number(surveyor.is_active) === 1;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [surveyors, setSurveyors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsResponse, surveyorsResponse] = await Promise.all([
        getAdminMetrics(),
        getAdminSurveyors()
      ]);
      setMetrics(metricsResponse.data || {});
      setSurveyors(surveyorsResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleStatusToggle = async (surveyor) => {
    const nextStatus = !isActiveSurveyor(surveyor);
    try {
      setUpdatingId(surveyor.id);
      await updateSurveyorStatus(surveyor.id, nextStatus);
      setSurveyors((current) => current.map((item) => (
        item.id === surveyor.id ? { ...item, is_active: nextStatus } : item
      )));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update surveyor status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const metricCards = [
    { label: 'Total Surveyors', value: metrics?.total_surveyors, icon: Users },
    { label: 'Total Surveys', value: metrics?.total_surveys, icon: ClipboardList },
    { label: 'Active Surveys', value: metrics?.active_surveys, icon: BarChart3 },
    { label: 'Total Submissions', value: metrics?.total_submissions, icon: FileText },
    { label: 'Question Banks', value: metrics?.total_question_banks, icon: BookOpen }
  ];

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-indigo-600" /> Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor QuizPulse activity and manage surveyor access.</p>
        </div>
        <button onClick={loadAdminData} disabled={loading} className="inline-flex self-start items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{tab.label}</button>)}
      </div>

      {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{error}</div>}

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {metricCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white rounded-md border border-zinc-200 p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-zinc-50 text-zinc-900"><Icon className="w-5 h-5" /></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">{label}</p><p className="text-2xl font-bold text-zinc-900 mt-1">{loading ? '—' : value ?? 0}</p></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2"><Users className="w-4 h-4" /><h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Surveyor Directory</h2></div>
            {loading ? <div className="p-10 text-center text-sm text-zinc-600">Loading surveyors...</div> : surveyors.length === 0 ? <div className="p-10 text-center text-sm text-zinc-600">No surveyors found.</div> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[800px]"><thead className="border-b border-zinc-200"><tr>{['Name', 'Email', 'Joined Date', 'Surveys Created', 'Responses Received', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">{heading}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200">{surveyors.map((surveyor) => { const active = isActiveSurveyor(surveyor); return <tr key={surveyor.id} className="hover:bg-zinc-50"><td className="px-4 py-3 text-sm font-medium text-zinc-900">{surveyor.name || 'Unnamed surveyor'}</td><td className="px-4 py-3 text-sm text-zinc-600">{surveyor.email}</td><td className="px-4 py-3 text-sm text-zinc-600">{surveyor.created_at ? new Date(surveyor.created_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-sm text-zinc-900">{surveyor.surveys_created ?? 0}</td><td className="px-4 py-3 text-sm text-zinc-900">{surveyor.responses_received ?? 0}</td><td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-900">{active ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-3"><button type="button" role="switch" aria-checked={active} aria-label={`Set ${surveyor.name || surveyor.email} ${active ? 'inactive' : 'active'}`} disabled={updatingId === surveyor.id} onClick={() => handleStatusToggle(surveyor)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${active ? 'bg-black' : 'bg-zinc-300'}`}><span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} /></button></td></tr>; })}</tbody></table></div>
            )}
          </div>
        </>
      )}

      {activeTab === 'surveys' && <SystemSurveys />}
    </div>
  );
}
