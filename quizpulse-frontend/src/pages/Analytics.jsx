import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSurveyAnalytics } from '../services/surveyService';
import { BarChart3, Users, Clock, ArrowLeft, RefreshCw, Eye, X } from 'lucide-react';

const formatAnswer = (value) => {
  if (value === null || value === undefined || value === '') return 'No answer provided';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join(', ') : typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
    } catch {
      return value;
    }
  }
  return String(value);
};

export default function Analytics() {
  const { id: surveyId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getSurveyAnalytics(surveyId);
      setAnalytics(res.data.data || res.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [surveyId]);

  const handleViewAnswers = (response) => {
    setSelectedResponse(response);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} aria-label="Go back" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" /> Survey Analytics
            </h1>
            <p className="text-xs text-slate-500">Real-time metrics via Stored Procedure <code className="text-indigo-600 font-mono">quiz.usp_getsurveyanalytics</code></p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </button>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading survey analytics...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Total Responses Metric Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-indigo-100 text-indigo-600 rounded-xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Completed Responses</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                  {analytics?.total_responses ?? 0}
                </h3>
              </div>
            </div>

            {/* Last Calculation Timestamp */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Calculation Timestamp</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {analytics?.calculated_at ? new Date(analytics.calculated_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

          </div>

          {/* Detailed Responses Table */}
          {analytics?.responses && analytics.responses.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Participant Submissions ({analytics.responses.length})</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Participant Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted At</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.responses.map((response, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {response.student_name || 'Anonymous'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {response.student_email || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {response.submitted_at ? new Date(response.submitted_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewAnswers(response)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Answers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Detailed Survey Answers */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Survey Response: {selectedResponse.student_name}
                </h3>
                <p className="text-xs text-slate-500">{selectedResponse.student_email}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                selectedResponse.answers.map((answer, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Question {idx + 1}</p>
                    <p className="text-sm font-semibold text-slate-800">{answer.question_text}</p>
                    <div className="mt-2 pl-3 border-l-2 border-indigo-500 bg-white p-2 rounded text-sm text-slate-700">
                      <strong>Response:</strong> {formatAnswer(answer.user_answer ?? answer.response_text)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No responses recorded for this user.</p>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
