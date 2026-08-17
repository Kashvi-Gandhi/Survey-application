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
    if (!window.confirm(`Delete “${selected.title}” and its questions?`))
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
          className={`w-full p-3 text-left border-b border-zinc-200 last:border-0 ${selected?.id === bank.id ? "bg-zinc-100 border-l-4 border-l-black" : "hover:bg-zinc-50"}`}
        >
          <div className="flex justify-between gap-2">
            <span className="text-sm font-semibold">{bank.title}</span>
            <span className="text-xs text-slate-500">
              {questionsFor(bank).length} Qs
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
    <div className="space-y-6">
      <header className="flex justify-between gap-4 pb-4 border-b border-zinc-200 text-zinc-900">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Database className="w-6 h-6" /> Question Banks
          </h1>
          <p className="text-sm text-zinc-600">
            Browse official templates or build reusable question banks.
          </p>
        </div>
        <button
          onClick={() => load(selected?.id)}
          className="self-start inline-flex gap-1 px-3 py-2 text-xs font-semibold bg-white text-black border border-zinc-200 hover:bg-zinc-100 rounded-md"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Data
        </button>
      </header>
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="space-y-4">
          <form onSubmit={create} className="p-4 bg-white border border-zinc-200 rounded-md">
            <h2 className="mb-3 text-xs font-bold uppercase">
              Create {isAdmin ? "Master Template" : "Custom Bank"}
            </h2>
            <div className="flex gap-2">
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="New question bank"
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-black outline-none"
              />
              <button className="p-2 text-white bg-black hover:bg-zinc-800 rounded-md">
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </form>
          <section className="overflow-hidden bg-white border border-zinc-200 rounded-md">
            <h2 className="p-3 text-xs font-bold text-zinc-900 uppercase bg-zinc-50 border-b border-zinc-200">
              Official Master Question Banks ({masters.length})
            </h2>
            {loading ? (
              <p className="p-4 text-xs text-slate-400">Loading…</p>
            ) : (
              <BankList items={masters} master />
            )}
          </section>
          <section className="overflow-hidden bg-white border border-zinc-200 rounded-md">
            <h2 className="p-3 text-xs font-bold text-zinc-900 uppercase bg-zinc-50 border-b border-zinc-200">
              {isAdmin ? "Surveyor Question Banks" : "My Custom Banks"} (
              {customs.length})
            </h2>
            {loading ? (
              <p className="p-4 text-xs text-slate-400">Loading…</p>
            ) : (
              <BankList items={customs} />
            )}
          </section>
        </aside>
        <section className="space-y-6 lg:col-span-2">
          {selected ? (
            <>
              <div className="flex justify-between gap-3 p-4 bg-white border rounded-xl">
                {edit ? (
                  <div className="flex-1 space-y-2">
                    <input
                      value={edit.title}
                      onChange={(event) =>
                        setEdit({ ...edit, title: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border rounded"
                    />
                    <textarea
                      value={edit.description}
                      onChange={(event) =>
                        setEdit({ ...edit, description: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border rounded"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold">{selected.title}</h2>
                    <p className="text-xs text-slate-500">
                      {selected.description || "No description"}
                    </p>
                  </div>
                )}
                {editable && (
                  <div className="flex gap-2">
                    {edit ? (
                      <>
                        <button
                          onClick={saveDetails}
                          className="px-3 py-1.5 text-xs text-white bg-emerald-600 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEdit(null)}
                          className="p-1.5 border rounded"
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
                          className="p-1.5 border rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={deleteBank}
                          className="p-1.5 text-red-600 border rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {editable ? (
                <>
                  <QuestionForm
                    bankId={selected.id}
                    onQuestionAdded={(question) =>
                      setDrafts((items) => [
                        ...items,
                        { ...question, client_id: crypto.randomUUID() },
                      ])
                    }
                  />
                  <div className="p-4 bg-white border rounded-xl">
                    <div className="flex justify-between">
                      <h3 className="text-xs font-bold uppercase">
                        Draft Questions ({drafts.length})
                      </h3>
                      <button
                        onClick={saveDrafts}
                        disabled={!drafts.length}
                        className="inline-flex gap-1 px-3 py-2 text-xs text-white bg-emerald-600 rounded disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Save All
                      </button>
                    </div>
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
                </>
              ) : (
                <div className="p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
                  Master templates are read-only. Select one when creating an
                  assessment to clone its questions.
                </div>
              )}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase">
                  Existing Questions ({questionsFor(selected).length})
                </h3>
                {questionsFor(selected).length ? (
                  questionsFor(selected).map((question, index) => (
                    <QuestionCard
                      key={question.id || index}
                      question={question}
                      onDelete={editable ? removeQuestion : undefined}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-slate-400 bg-white border border-dashed rounded">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2" />
                    No questions in this bank.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white border rounded">
              Select a question bank to begin.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
