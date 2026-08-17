import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestionBanks } from '../services/bankService';
import { createSurvey, importSelectedQuestions } from '../services/surveyService';
import { PlusCircle, Database, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreateSurvey() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
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

  const getCurrentBank = () => banks.find(b => b.id === selectedBankId);
  const getCurrentQuestions = () => {
    const bank = getCurrentBank();
    return bank?.questions || bank?.question_list || [];
  };

  const handleQuestionToggle = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleBankChange = (bankId) => {
    setSelectedBankId(bankId);
    setSelectedQuestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedBankId || selectedQuestions.length === 0) {
      setError('Please provide a survey title, select a question bank, and choose at least one question.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create survey shell
      const surveyRes = await createSurvey({ title, description });
      
      // Safely extract survey ID
      const surveyId = surveyRes?.data?.id || surveyRes?.id;

      if (!surveyId) {
        throw new Error('Survey ID was not returned by the server.');
      }

      // 2. Import selected questions
      await importSelectedQuestions(surveyId, selectedBankId, selectedQuestions);

      // Redirect to Dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Error creating assessment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to publish assessment survey.');
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
              onChange={(e) => handleBankChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {banks.length === 0 ? (
                <option value="">No question banks available</option>
              ) : (
                banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {(b.is_master || b.is_global || String(b.created_by_role || '').toLowerCase() === 'admin') ? `[MASTER TEMPLATE] ${b.title}` : String(b.created_by) === String(user?.id) ? `[MY BANK] ${b.title}` : b.title} ({getQuestionCount(b)} questions)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedBankId && getCurrentQuestions().length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Questions ({selectedQuestions.length} selected)
            </label>
            <div className="max-h-60 overflow-y-auto border border-slate-300 rounded-md bg-slate-50">
              {getCurrentQuestions().map((question, idx) => (
                <label key={question.id} className="flex items-start gap-3 p-3 border-b border-slate-200 last:border-b-0 hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.id)}
                    onChange={() => handleQuestionToggle(question.id)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-medium text-slate-600">Q{idx + 1}:</span>
                    <p className="text-sm text-slate-800">{question.question_text}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

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
            disabled={loading || banks.length === 0 || selectedQuestions.length === 0}
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
