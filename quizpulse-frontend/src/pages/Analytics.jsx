import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSurveyAnalytics } from '../services/surveyService';
import { BarChart3, Users, Clock, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Analytics() {
  const { id: surveyId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getSurveyAnalytics(surveyId);
      setAnalytics(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics from stored procedure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [surveyId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
      )}
    </div>
  );
}