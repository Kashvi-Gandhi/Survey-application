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
  ];

  return (
    <div className="space-y-3">
      {/* Error Alert */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Main Big Box */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100">
              <ShieldCheck className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Monitor QuizPulse activity and manage surveyor access.</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          
          {/* Tab Navigation - Mini Box */}
          <div className="inline-flex gap-1 bg-slate-50 rounded-full p-1.5 border border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Metric Cards Grid - Mini Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-slate-50">
                        <Icon className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {loading ? '—' : value ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Surveyor Directory Table */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                {/* Table Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Surveyor Directory
                  </h2>
                </div>

                {/* Table Content */}
                {loading ? (
                  <div className="p-10 text-center text-sm text-slate-500">Loading surveyors...</div>
                ) : surveyors.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">No surveyors found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {['Name', 'Email', 'Joined Date', 'Surveys Created', 'Responses Received', 'Status', 'Actions'].map((heading) => (
                            <th
                              key={heading}
                              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {surveyors.map((surveyor) => {
                          const active = isActiveSurveyor(surveyor);
                          return (
                            <tr key={surveyor.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {surveyor.name || 'Unnamed surveyor'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{surveyor.email}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {surveyor.created_at ? new Date(surveyor.created_at).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {surveyor.surveys_created ?? 0}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {surveyor.responses_received ?? 0}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    active
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={active}
                                  aria-label={`Set ${surveyor.name || surveyor.email} ${active ? 'inactive' : 'active'}`}
                                  disabled={updatingId === surveyor.id}
                                  onClick={() => handleStatusToggle(surveyor)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                    active ? 'bg-[#3B6280]' : 'bg-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                      active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* System Surveys Tab */}
          {activeTab === 'surveys' && (
            <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 p-6">
              <SystemSurveys />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
