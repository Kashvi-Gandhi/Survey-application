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
    <div className="space-y-6 text-zinc-900">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" /> Assessment Dashboard
          </h1>
          <p className="text-sm text-zinc-600">Overview of active surveys, question repositories, and response metrics.</p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/banks"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 text-black font-medium text-xs rounded-md border border-zinc-200 transition-colors"
          >
            <Database className="w-4 h-4" /> Question Banks
          </Link>
          <Link
            to="/create-survey"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-zinc-800 text-white font-medium text-xs rounded-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> New Survey
          </Link>
        </div>
      </div>

      {/* Published Surveys Table */}
      <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Active Assessment Surveys ({surveys.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-600">Loading surveys...</div>
        ) : surveys.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-600">
            No active surveys created yet. Click <strong>"New Survey"</strong> to create one.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {surveys.map((survey) => (
              <div key={survey.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{survey.title}</h3>
                  <p className="text-xs text-zinc-600 mt-0.5">{survey.description || 'No description provided'}</p>
                  <span className="inline-block mt-2 text-[10px] bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md">
                    ID: {survey.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/surveys/${survey.id}/edit`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit Survey
                  </Link>
                  <Link
                    to={`/survey/${survey.id}`}
                    target="_blank"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Public Link
                  </Link>
                  <Link
                    to={`/analytics/${survey.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Analytics
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteSurvey(survey)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors"
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
