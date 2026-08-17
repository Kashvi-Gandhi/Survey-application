import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { createSurvey, updateSurvey } from '../services/surveyService';
import { getQuestionBanks } from '../services/bankService';
import { ArrowLeft, Save, Plus, Trash2, Database, Copy, LockKeyhole } from 'lucide-react';

const choiceTypes = ['mcq_single', 'mcq_multiple'];
const types = [['mcq_single', 'MCQ Single Select'], ['mcq_multiple', 'MCQ Multiple Select'], ['true_false', 'True / False'], ['yes_no', 'Yes / No'], ['text', 'Text'], ['numeric', 'Numeric Answer'], ['rating', 'Rating']];
const parseOptions = (value) => { if (Array.isArray(value)) return value; try { return value ? JSON.parse(value) : []; } catch { return []; } };
const optionsFor = (type, options = []) => type === 'true_false' ? ['True', 'False'] : type === 'yes_no' ? ['Yes', 'No'] : choiceTypes.includes(type) ? options : [];
const normalize = (q, index) => ({ question_text: q.question_text || '', question_type: q.question_type || q.type || 'mcq_single', options: parseOptions(q.options), points: q.points ?? 1, is_required: q.is_required ?? true, order_index: index + 1 });

export default function EditSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [surveyResult, bankResult] = await Promise.all([
          API.get(`/surveys/${id}`),
          getQuestionBanks()
        ]);
        const data = surveyResult.data.data;
        setSurvey(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setQuestions((data.questions || []).map(normalize));
        const available = bankResult.data?.data || bankResult.data || [];
        setBanks(available);
        setSelectedBankId(available[0]?.id || '');
      } catch {
        setError('Unable to load this survey.');
      }
    })();
  }, [id]);

  const locked = survey?.has_responses || Number(survey?.response_count) > 0;

  const changeQuestion = (index, update) =>
    setQuestions(items => items.map((q, i) => i === index ? { ...q, ...update } : q));

  const saveQuestions = () =>
    questions.map((q, index) => ({
      ...q,
      options: optionsFor(q.question_type, q.options)
        .map(v => v.trim())
        .filter(Boolean),
      order_index: index + 1
    }));

  const invalid = () =>
    questions.some(
      q =>
        !q.question_text.trim() ||
        (choiceTypes.includes(q.question_type) && q.options.filter(Boolean).length < 2)
    );

  const submit = async (event) => {
    event.preventDefault();
    if (!locked && invalid()) {
      setError('Each question needs a prompt; multiple-choice questions need at least two options.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await updateSurvey(id, {
        title,
        description,
        ...(locked ? {} : { questions: saveQuestions() })
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update survey.');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    try {
      setSaving(true);
      setError('');
      const copyTitle = `${title} (Copy)`;
      const created = await createSurvey({ title: copyTitle, description });
      const newId = created?.data?.id || created?.id;
      if (!newId) throw new Error('The copied survey ID was not returned.');
      await updateSurvey(newId, {
        title: copyTitle,
        description,
        questions: saveQuestions()
      });
      navigate(`/surveys/${newId}/edit`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to duplicate survey.');
    } finally {
      setSaving(false);
    }
  };

  const importBank = () => {
    const bank = banks.find(b => String(b.id) === String(selectedBankId));
    const source = bank?.questions || bank?.question_list || [];
    setQuestions(current => [
      ...current,
      ...source.map((q, i) => normalize(q, current.length + i))
    ]);
  };

  if (!survey && !error)
    return (
      <div className="p-12 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm shadow-slate-300/40 border border-slate-100 inline-block">
          <p className="text-sm text-slate-500">Loading survey...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Floating Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm shadow-slate-300/40 border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-900">Edit Survey</h1>
        <p className="text-sm text-slate-500 mt-2">Update details and, before responses arrive, questions.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Locked Banner */}
      {locked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex items-center justify-between gap-4">
          <span className="flex items-center gap-3 text-sm font-medium text-yellow-900">
            <div className="p-2.5 rounded-xl bg-yellow-100">
              <LockKeyhole className="w-5 h-5 text-yellow-700" />
            </div>
            Question structure is locked because this survey has received responses.
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={duplicate}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B6280] hover:bg-[#2C4B63] disabled:opacity-50 rounded-full transition-colors"
          >
            <Copy className="w-4 h-4" /> Duplicate & Edit
          </button>
        </div>
      )}

      {/* Main Form - Floating Card */}
      {survey && (
        <form onSubmit={submit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm shadow-slate-300/40 border border-slate-100 space-y-6">
          
          {/* Survey Details */}
          <div className="space-y-4">
            <Field label="Survey Title" value={title} onChange={setTitle} required />
            <Field label="Description / Instructions" value={description} onChange={setDescription} multiline />
          </div>

          {/* Questions Section */}
          <div className="pt-6 border-t border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Questions ({questions.length})
              </h2>

              {!locked && (
                <div className="flex flex-wrap gap-2">
                  {/* Question Bank Selector */}
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-full focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Select question bank...</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>

                  {/* Import Bank Button */}
                  <button
                    type="button"
                    onClick={importBank}
                    disabled={!selectedBankId}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-full transition-colors"
                  >
                    <Database className="w-4 h-4" /> Import Bank
                  </button>

                  {/* Add New Question Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions(q => [...q, normalize({ options: ['', ''] }, q.length)])
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B6280] hover:bg-[#2C4B63] rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>
              )}
            </div>

            {/* No Questions Placeholder */}
            {questions.length === 0 && (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm text-slate-500">No questions added yet.</p>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, i) => (
                <Question
                  key={i}
                  question={q}
                  index={i}
                  locked={locked}
                  change={changeQuestion}
                  remove={() => setQuestions(items => items.filter((_, at) => at !== i))}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#3B6280] hover:bg-[#2C4B63] disabled:opacity-50 rounded-full transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, multiline }) {
  const className =
    'w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none';
  return (
    <div>
      <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows="4"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={className}
        />
      )}
    </div>
  );
}

function Question({ question, index, locked, change, remove }) {
  const typeChange = type =>
    change(index, {
      question_type: type,
      options: optionsFor(type, question.options)
    });

  return (
    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-4">
      {/* Question Number & Text */}
      <div className="flex gap-3">
        <span className="text-xs font-bold text-slate-500 pt-2.5 shrink-0 bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg">
          Q{index + 1}
        </span>
        <div className="flex-1 space-y-1">
          <input
            readOnly={locked}
            value={question.question_text}
            onChange={e => change(index, { question_text: e.target.value })}
            placeholder="Enter question prompt"
            className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        {!locked && (
          <button
            type="button"
            onClick={remove}
            className="p-2.5 text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question Type Selector */}
      <select
        disabled={locked}
        value={question.question_type}
        onChange={e => typeChange(e.target.value)}
        className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
      >
        {types.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Options for Multiple Choice */}
      {choiceTypes.includes(question.question_type) && (
        <div className="space-y-2 pt-2">
          {question.options.map((option, oi) => (
            <input
              key={oi}
              readOnly={locked}
              value={option}
              onChange={e =>
                change(index, {
                  options: question.options.map((v, at) =>
                    at === oi ? e.target.value : v
                  )
                })
              }
              placeholder={`Option ${oi + 1}`}
              className="block w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          ))}
          {!locked && (
            <button
              type="button"
              onClick={() =>
                change(index, { options: [...question.options, ''] })
              }
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 pt-1"
            >
              + Add choice option
            </button>
          )}
        </div>
      )}

      {/* Predefined Options */}
      {['true_false', 'yes_no'].includes(question.question_type) && (
        <p className="text-xs text-slate-500 pt-1">
          <span className="font-medium">Options:</span> {optionsFor(question.question_type).join(', ')}
        </p>
      )}
    </div>
  );
}
