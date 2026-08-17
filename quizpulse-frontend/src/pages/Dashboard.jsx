import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { deleteSurvey } from '../services/surveyService';
import { Pencil, ExternalLink, BarChart2, Trash2, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteSurvey = async (survey) => {
    if (!window.confirm(`Delete "${survey.title}"? This permanently removes its questions and responses.`)) return;
    try {
      await deleteSurvey(survey.id);
      setSurveys((current) => current.filter((item) => item.id !== survey.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete survey. Please try again.');
    }
  };

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await API.get('/surveys');
        setSurveys(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch surveys:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  return (
    <div className="space-y-6">
      {/* Single Table Block - Floating Card */}
      <div className="bg-white rounded-3xl shadow-sm shadow-slate-300/40 border border-slate-100 overflow-hidden">
        
        {/* Table Header with Title & Description */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-slate-50 to-slate-50 border-b border-slate-150">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-teal-100">
              <ClipboardList className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Active Surveys</h2>
              <p className="text-sm text-slate-500 mt-0.5">View, edit, and manage all your active assessment surveys</p>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading surveys...</div>
        ) : surveys.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No surveys found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-700 w-1/4">
                    Survey Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-700 w-1/5">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-700 w-1/2">
                    Survey ID
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-700 w-auto">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveys.map((survey) => (
                  <tr 
                    key={survey.id} 
                    className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-blue-50/30 transition-colors duration-200 border-b border-slate-50"
                  >
                    {/* Survey Title */}
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {survey.title}
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="line-clamp-1">
                        {survey.description || '—'}
                      </span>
                    </td>

                    {/* ID */}
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono bg-slate-50 rounded-lg">
                      <code className="text-slate-600">{survey.id}</code>
                    </td>

                    {/* Actions - Icon Buttons */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Edit */}
                        <Link
                          to={`/surveys/${survey.id}/edit`}
                          className="p-2.5 bg-blue-100/70 hover:bg-blue-200 text-blue-700 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Edit Survey"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>

                        {/* Public Link */}
                        <Link
                          to={`/survey/${survey.id}`}
                          target="_blank"
                          className="p-2.5 bg-green-100/70 hover:bg-green-200 text-green-700 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Open Public Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Analytics */}
                        <Link
                          to={`/analytics/${survey.id}`}
                          className="p-2.5 bg-amber-100/70 hover:bg-amber-200 text-amber-700 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                          title="View Analytics"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSurvey(survey)}
                          className="p-2.5 bg-red-100/70 hover:bg-red-200 text-red-700 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Delete Survey"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
}
