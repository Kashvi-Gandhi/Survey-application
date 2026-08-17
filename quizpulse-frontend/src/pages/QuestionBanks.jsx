import React, { useEffect, useState } from "react";
import {
  Database,
  FolderPlus,
  HelpCircle,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  createQuestionBank,
  deleteQuestionBank,
  getQuestionBanks,
  updateQuestionBank,
} from "../services/bankService";
import {
  createQuestionsBatch,
  deleteQuestion,
} from "../services/surveyService";
import { useAuth } from "../context/AuthContext";
import QuestionCard from "../components/questions/QuestionCard";
import QuestionForm from "../components/questions/QuestionForm";

const questionsFor = (bank) =>
  Array.isArray(bank?.questions) ? bank.questions : [];
const isMaster = (bank) =>
  bank?.is_global === true ||
  Number(bank?.is_global) === 1 ||
  String(bank?.created_by_role).toLowerCase() === "admin";

export default function QuestionBanks() {
  const { user, isAdmin } = useAuth();
  const [banks, setBanks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mine = (bank) => String(bank?.created_by) === String(user?.id);
  const canManage = (bank) => isAdmin || mine(bank);
  const masters = banks.filter(isMaster);
  const customs = banks.filter(
    (bank) => !isMaster(bank) && (isAdmin || mine(bank)),
  );

  const load = async (id) => {
    try {
      setError("");
      const response = await getQuestionBanks();
      const data = response.data || [];
      setBanks(data);
      setSelected(
        data.find((bank) => bank.id === (id || selected?.id)) ||
          data[0] ||
          null,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load question banks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pageContainer = document.querySelector("main");
    pageContainer?.classList.add("question-banks-page");
    load();
    return () => pageContainer?.classList.remove("question-banks-page");
  }, []);

  const create = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const response = await createQuestionBank({ title });
      setTitle("");
      await load(response.data?.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create bank.");
    }
  };

  const saveDetails = async () => {
    if (!edit?.title?.trim()) return setError("Bank title is required.");
    try {
      await updateQuestionBank(selected.id, edit);
      setEdit(null);
      await load(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update bank.");
    }
  };

  const deleteBank = async () => {
    if (!window.confirm(`Delete "${selected.title}" and its questions?`))
      return;
    try {
      await deleteQuestionBank(selected.id);
      setDrafts([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete bank.");
    }
  };

  const saveDrafts = async () => {
    if (!drafts.length) return;
    try {
      await createQuestionsBatch(
        null,
        drafts.map(({ client_id, type, ...question }) => ({
          ...question,
          question_type: type,
        })),
      );
      setDrafts([]);
      await load(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save questions.");
    }
  };

  const removeQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      await load(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question.");
    }
  };

  const BankList = ({ items, master }) =>
    items.length ? (
      items.map((bank) => (
        <button
          key={bank.id}
          onClick={() => {
            setSelected(bank);
            setDrafts([]);
            setEdit(null);
          }}
          className={`w-full p-3 text-left border-b border-slate-100 last:border-0 transition-colors ${
            selected?.id === bank.id
              ? "bg-teal-50 border-l-4 border-l-teal-600 text-teal-900"
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex justify-between gap-2 items-start">
            <span className="text-sm font-semibold">{bank.title}</span>
            <span className="text-xs text-slate-500 shrink-0">
              {questionsFor(bank).length}Q
            </span>
          </div>
          {isAdmin && !master && (
            <p className="mt-1 text-[11px] text-slate-500">
              {bank.creator_name || "Unknown creator"}
              {bank.creator_email ? ` · ${bank.creator_email}` : ""}
            </p>
          )}
        </button>
      ))
    ) : (
      <p className="p-4 text-xs text-slate-400">No banks found.</p>
    );

  const editable = canManage(selected);

  return (
    <div className="space-y-3">
      {/* Error Alert */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        
        {/* LEFT BOX - Create Bank + 2 Lists */}
        <div className={`lg:col-span-1 ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 overflow-hidden">
            
            {/* Header Section */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50">
              <h2 className="text-2xl font-bold text-slate-900">Question Banks</h2>
              <p className="text-xs text-slate-500 mt-1">Select an existing bank to edit it, or start a brand-new one.</p>
            </div>

            {/* Create Bank Section */}
            <div className="p-4 border-b border-slate-100">
              <h3 className="mb-3 text-xs font-bold uppercase text-slate-900">
                Create {isAdmin ? "Master Template" : "Custom Bank"}
              </h3>
              <form onSubmit={create} className="flex gap-2">
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="New question bank"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  className="p-2.5 text-white bg-[#3B6280] hover:bg-[#2C4B63] rounded-lg shadow-sm transition-colors"
                  type="submit"
                >
                  <FolderPlus className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Master Banks Section */}
            <div className="border-b border-slate-100">
              <h4 className="p-3 text-xs font-bold text-emerald-700 uppercase bg-emerald-50 border-b border-emerald-100">
                Master Templates ({masters.length})
              </h4>
              <div className="max-h-40 overflow-y-auto">
                {loading ? (
                  <p className="p-4 text-xs text-slate-400">Loading…</p>
                ) : (
                  <BankList items={masters} master />
                )}
              </div>
            </div>

            {/* Custom Banks Section */}
            <div>
              <h4 className="p-3 text-xs font-bold text-sky-700 uppercase bg-sky-50 border-b border-sky-100">
                {isAdmin ? "Surveyor Banks" : "My Custom Banks"} ({customs.length})
              </h4>
              {loading ? (
                <p className="p-4 text-xs text-slate-400">Loading…</p>
              ) : (
                <BankList items={customs} />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT BOX - Question Bank Designer */}
        <div className="lg:col-span-3">
          <div className="flex gap-3 mb-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            >
              {sidebarOpen ? (
                <>
                  <ChevronLeft className="w-4 h-4" /> Collapse
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" /> Expand
                </>
              )}
            </button>
          </div>

          {selected ? (
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 overflow-hidden">
              
              {/* Question Bank Designer Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900">Question Bank Details</h2>
                <p className="text-sm text-slate-500 mt-1">Create a new question bank from the editable template.</p>
              </div>

              {/* Bank Details + Question Form in ONE BOX */}
              <div className="p-6 space-y-6 border-b border-slate-100">
                
                {/* Bank Details */}
                <div>
                  {edit ? (
                    <div className="space-y-3">
                      <input
                        value={edit.title}
                        onChange={(event) =>
                          setEdit({ ...edit, title: event.target.value })
                        }
                        className="w-full px-4 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <textarea
                        value={edit.description}
                        onChange={(event) =>
                          setEdit({ ...edit, description: event.target.value })
                        }
                        rows="3"
                        className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selected.title}</h3>
                      <p className="text-sm text-slate-500 mt-2">
                        {selected.description || "No description provided"}
                      </p>
                    </div>
                  )}
                  {editable && (
                    <div className="mt-4 flex gap-2">
                      {edit ? (
                        <>
                          <button
                            onClick={saveDetails}
                            className="px-4 py-2 text-xs text-white bg-[#3B6280] hover:bg-[#2C4B63] rounded-full transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEdit(null)}
                            className="p-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              setEdit({
                                title: selected.title,
                                description: selected.description || "",
                              })
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={deleteBank}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Form */}
                {editable && (
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold uppercase text-slate-900 mb-4">Add New Question</h4>
                    <QuestionForm
                      bankId={selected.id}
                      onQuestionAdded={(question) =>
                        setDrafts((items) => [
                          ...items,
                          { ...question, client_id: crypto.randomUUID() },
                        ])
                      }
                    />
                  </div>
                )}

                {!editable && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-sm text-teal-900 font-medium">
                      Master templates are read-only. Select one when creating an assessment to clone its questions.
                    </p>
                  </div>
                )}
              </div>

              {/* Drafts Section (if any) */}
              {drafts.length > 0 && (
                <div className="p-6 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold uppercase text-slate-900">
                      Draft Questions ({drafts.length})
                    </h4>
                    <button
                      onClick={saveDrafts}
                      className="inline-flex gap-2 px-4 py-2 text-xs font-medium text-white bg-[#3B6280] hover:bg-[#2C4B63] rounded-full transition-colors"
                    >
                      <Save className="w-4 h-4" /> Save All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {drafts.map((question) => (
                      <QuestionCard
                        key={question.client_id}
                        question={question}
                        onDelete={() =>
                          setDrafts((items) =>
                            items.filter(
                              (item) => item.client_id !== question.client_id,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Questions */}
              <div className="p-6">
                <h4 className="text-sm font-bold uppercase text-slate-900 mb-4">
                  Existing Questions ({questionsFor(selected).length})
                </h4>
                {questionsFor(selected).length ? (
                  <div className="space-y-3">
                    {questionsFor(selected).map((question, index) => (
                      <QuestionCard
                        key={question.id || index}
                        question={question}
                        onDelete={editable ? removeQuestion : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium">No questions in this bank</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm shadow-slate-300/40 border border-slate-100 text-center">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Select a question bank to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
