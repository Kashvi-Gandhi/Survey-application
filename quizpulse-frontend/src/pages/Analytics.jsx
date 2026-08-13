import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSurveyAnalytics } from '../services/surveyService';
import { BarChart3, Users, Clock, ArrowLeft, RefreshCw, Eye, X } from 'lucide-react';

export default function Analytics() {
  const { id: surveyId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getSurveyAnalytics(surveyId);
      console.log('Analytics response:', res.data);
      setAnalytics(res.data.data || res.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics from stored procedure.');
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" /> Survey Analytics
            </h1>
            <p className="text-xs text-slate-500">Real-time metrics via Stored Procedure <code className="text-indigo-600 font-mono">fn_get_survey_analytics</code></p>
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
        <div className="p-12 text-center text-sm text-slate-400">Executing database stored procedure...</div>
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

            {/* Stored Procedure Execution Time */}
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
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Individual Responses ({analytics.responses.length})</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted At</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th>
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
                          {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {response.total_score || 0} pts
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewAnswers(response)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Eye className="w-3 h-3" />
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

      {/* Modal for Response Details */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                Response Details - {selectedResponse.student_name || 'Anonymous'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                <div className="space-y-4">
                  {selectedResponse.answers.map((answer, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm font-medium text-slate-800 mb-2">
                        <span className="text-indigo-600">Q{idx + 1}:</span> {answer.question_text}
                      </p>
                      <p className="text-sm text-slate-700 pl-4 border-l-2 border-indigo-200">
                        <strong>Answer:</strong> {answer.user_answer || 'No answer provided'}
                      </p>
                      {answer.is_correct !== null && (
                        <p className="text-xs mt-1 pl-4">
                          <span className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                            {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No detailed answers available for this response.</p>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-md transition-colors"
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