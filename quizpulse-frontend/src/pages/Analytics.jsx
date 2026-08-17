import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getSurveyAnalytics } from '../services/surveyService';
import { BarChart3, Users, Clock, ArrowLeft, Eye, X, Download } from 'lucide-react';

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

  const exportAllResponses = () => {
    if (!analytics?.responses || analytics.responses.length === 0) {
      alert('No survey responses are available to export yet.');
      return;
    }

    const questionColumns = new Set();

    analytics.responses.forEach((response) => {
      (response.answers || []).forEach((answer, index) => {
        const questionKey = answer.question_text || `Question ${index + 1}`;
        questionColumns.add(questionKey);
      });
    });

    const exportRows = analytics.responses.map((response) => {
      const row = {
        'Participant Name': response.student_name || 'Anonymous',
        Email: response.student_email || 'N/A',
        'Submitted At': response.submitted_at ? new Date(response.submitted_at).toLocaleString() : 'N/A'
      };

      (response.answers || []).forEach((answer, index) => {
        const questionKey = answer.question_text || `Question ${index + 1}`;
        row[questionKey] = formatAnswer(answer.user_answer ?? answer.response_text);
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows, {
      header: ['Participant Name', 'Email', 'Submitted At', ...Array.from(questionColumns)]
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Responses');
    XLSX.writeFile(workbook, `survey-responses-${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-3">
      
      {/* Back Button */}
      <button 
        type="button" 
        onClick={goBack} 
        aria-label="Go back"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-full transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Error Alert */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm shadow-slate-300/40 border border-slate-100 inline-block">
            <p className="text-slate-500 text-sm">Loading survey analytics...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100">
                <BarChart3 className="w-6 h-6 text-teal-700" />
              </div>
              Survey Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-2">Real-time metrics and participant submissions</p>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            
            {/* Statistics Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Total Responses */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Completed Responses</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {analytics?.total_responses ?? 0}
                  </p>
                </div>
              </div>

              {/* Last Calculation Timestamp */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Clock className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Last Calculation Timestamp</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {analytics?.calculated_at ? new Date(analytics.calculated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

            </div>

            {/* Participant Submissions Table */}
            {analytics?.responses && analytics.responses.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Participant Submissions ({analytics.responses.length})
                  </h2>
                  <button
                    type="button"
                    onClick={exportAllResponses}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#3B6280] hover:bg-[#2C4B63] rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Export All Responses (.xlsx)
                  </button>
                </div>
                
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Participant Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Submitted At</th>
                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.responses.map((response, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-slate-900">
                            {response.student_name || 'Anonymous'}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600">
                            {response.student_email || 'N/A'}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600">
                            {response.submitted_at ? new Date(response.submitted_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <button
                              onClick={() => handleViewAnswers(response)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-full border border-teal-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Answers
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!analytics?.responses || analytics.responses.length === 0) && (
              <div className="text-center py-8 text-slate-500 border-t border-slate-100 pt-6">
                <p className="text-sm">No participant submissions yet</p>
              </div>
            )}
          </div>
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
                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Question {idx + 1}</p>
                    <p className="text-sm font-semibold text-slate-800">{answer.question_text}</p>
                    <div className="mt-2 pl-3 border-l-2 border-teal-500 bg-white p-2 rounded text-sm text-slate-700">
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
                className="px-4 py-2 bg-[#3B6280] hover:bg-[#2C4B63] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
