import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { deleteSurvey } from '../services/surveyService';
import { LayoutDashboard, PlusCircle, ExternalLink, BarChart2, Database, ClipboardList, Pencil, Trash2 } from 'lucide-react';

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
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" /> Assessment Dashboard
          </h1>
          <p className="text-sm text-slate-500">Overview of active surveys, question repositories, and response metrics.</p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/banks"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-md transition-colors"
          >
            <Database className="w-4 h-4" /> Question Banks
          </Link>
          <Link
            to="/create-survey"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> New Survey
          </Link>
        </div>
      </div>

      {/* Published Surveys Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-600" /> Active Assessment Surveys ({surveys.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading surveys...</div>
        ) : surveys.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No active surveys created yet. Click <strong>"New Survey"</strong> to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {surveys.map((survey) => (
              <div key={survey.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{survey.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{survey.description || 'No description provided'}</p>
                  <span className="inline-block mt-2 text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded">
                    ID: {survey.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!survey.has_responses && Number(survey.response_count) === 0 && (
                    <Link to={`/surveys/${survey.id}/edit`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Edit Survey
                    </Link>
                  )}
                  <Link
                    to={`/survey/${survey.id}`}
                    target="_blank"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Public Link
                  </Link>
                  <Link
                    to={`/analytics/${survey.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-sm"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Analytics
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteSurvey(survey)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
