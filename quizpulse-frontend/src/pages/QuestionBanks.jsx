import React, { useState, useEffect } from 'react';
import { getQuestionBanks, createQuestionBank, addQuestionToBank } from '../services/bankService';
import QuestionCard from '../components/questions/QuestionCard';
import QuestionForm from '../components/questions/QuestionForm';
import { Database, FolderPlus, HelpCircle, RefreshCw } from 'lucide-react';

export default function QuestionBanks() {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [newBankTitle, setNewBankTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingBank, setCreatingBank] = useState(false);

  const fetchBanks = async (keepSelectedId = null) => {
    try {
      const res = await getQuestionBanks();
      // Safely extract array regardless of backend payload structure
      const loadedBanks = res.data || [];
      setBanks(loadedBanks);

      if (loadedBanks.length > 0) {
        const targetId = keepSelectedId || selectedBank?.id || loadedBanks[0].id;
        const current = loadedBanks.find((b) => b.id === targetId) || loadedBanks[0];
        setSelectedBank(current);
      }
    } catch (err) {
      console.error('Failed to fetch question banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleCreateBank = async (e) => {
    e.preventDefault();
    if (!newBankTitle.trim()) return;

    try {
      setCreatingBank(true);
      const res = await createQuestionBank({ title: newBankTitle });
      setNewBankTitle('');
      const newBankId = res.data?.id;
      await fetchBanks(newBankId);
    } catch (err) {
      console.error('Error creating bank via stored procedure:', err);
    } finally {
      setCreatingBank(false);
    }
  };

  const handleAddQuestion = async (questionPayload) => {
    try {
      // 1. Trigger Stored Procedure to save question to DB
      await addQuestionToBank(questionPayload);
      // 2. Re-fetch fresh bank data from Postgres to update questions list
      await fetchBanks(selectedBank.id);
    } catch (err) {
      console.error('Error adding question via stored procedure:', err);
      alert('Failed to save question. Please check backend logs.');
    }
  };

  // Helper to extract questions list safely across different payload schemas
  const getQuestionsList = (bank) => {
    if (!bank) return [];
    if (Array.isArray(bank.questions)) return bank.questions;
    if (Array.isArray(bank.question_list)) return bank.question_list;
    return [];
  };

  const currentQuestions = getQuestionsList(selectedBank);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" /> Question Banks
          </h1>
          <p className="text-sm text-slate-500">Organize and construct question repositories for assessment surveys</p>
        </div>

        <button
          onClick={() => fetchBanks(selectedBank?.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Bank List & Creator */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Create Question Bank</h2>
            <form onSubmit={handleCreateBank} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g., CS101 Midterm Prep"
                value={newBankTitle}
                onChange={(e) => setNewBankTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={creatingBank}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Available Repositories ({banks.length})
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading banks...</div>
              ) : banks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No question banks found.</div>
              ) : (
                banks.map((bank) => {
                  const qCount = getQuestionsList(bank).length;
                  return (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBank(bank)}
                      className={`w-full text-left p-3 text-sm transition-colors flex items-center justify-between ${
                        selectedBank?.id === bank.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{bank.title}</span>
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-normal">
                        {qCount} Qs
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBank ? (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedBank.title}</h2>
                  <p className="text-xs text-slate-500">Bank ID: {selectedBank.id}</p>
                </div>
              </div>

              {/* Dynamic Question Builder Form */}
              <QuestionForm bankId={selectedBank.id} onQuestionAdded={handleAddQuestion} />

              {/* List of Questions in Bank */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Existing Questions ({currentQuestions.length})
                </h3>

                {currentQuestions.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-400 text-sm">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No questions added to this bank yet. Use the builder above to add questions.
                  </div>
                ) : (
                  currentQuestions.map((q, idx) => (
                    <QuestionCard key={q.id || idx} question={q} />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
              Select or create a question bank on the left to start adding questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}