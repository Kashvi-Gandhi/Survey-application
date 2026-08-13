import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestionBanks } from '../services/bankService';
import { createSurvey, importBankToSurvey } from '../services/surveyService';
import { PlusCircle, Database, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateSurvey() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await getQuestionBanks();
        const availableBanks = res.data?.data || res.data || [];
        setBanks(availableBanks);
        if (availableBanks.length > 0) {
          setSelectedBankId(availableBanks[0].id);
        }
      } catch (err) {
        console.error('Failed to load question banks:', err);
      }
    };
    fetchBanks();
  }, []);

  const getQuestionCount = (bank) => {
    if (Array.isArray(bank.questions)) return bank.questions.length;
    if (Array.isArray(bank.question_list)) return bank.question_list.length;
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedBankId) {
      setError('Please provide a survey title and select a valid question bank.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create survey shell via Stored Procedure endpoint
      const surveyRes = await createSurvey({ title, description });
      const surveyId = surveyRes.data?.id;

      // 2. Import questions from selected bank via Stored Procedure endpoint
      await importBankToSurvey(surveyId, selectedBankId);

      // Redirect to Dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish assessment survey. Ensure the bank contains questions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-indigo-600" /> Create Assessment Survey
        </h1>
        <p className="text-sm text-slate-500">Configure a survey assessment and populate it from a Question Bank repository.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Assessment Title
          </label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., End-of-Term Computer Science Evaluation"
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description / Instructions
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description or student guidance notes..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Source Question Bank
          </label>
          <div className="relative">
            <Database className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <select
              required
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {banks.length === 0 ? (
                <option value="">No question banks available</option>
              ) : (
                banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({getQuestionCount(b)} questions)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || banks.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Creating Assessment...' : 'Publish Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}