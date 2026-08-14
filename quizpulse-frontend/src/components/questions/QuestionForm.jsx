import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function QuestionForm({ bankId, onQuestionAdded }) {
  const [questionText, setQuestionText] = useState('');
  const [type, setType] = useState('mcq');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOptionField = () => {
    setOptions([...options, '']);
  };

  const removeOptionField = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
    if (!questionText.trim()) {
      setError('Enter a question prompt.');
      return;
    }
    if (type === 'mcq' && cleanedOptions.length < 2) {
      setError('Multiple choice questions need at least two options.');
      return;
    }

    onQuestionAdded({
      bank_id: bankId,
      question_text: questionText.trim(),
      type,
      options: type === 'mcq' ? cleanedOptions : null
    });
    setQuestionText('');
    setType('mcq');
    setOptions(['', '']);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Add New Question</h3>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
        <input
          type="text"
          required
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="e.g., How satisfied are you with our technical support?"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="rating">Rating Scale (1 - 5 Stars)</option>
            <option value="text">Short Text Response</option>
          </select>
        </div>
      </div>

      {/* Dynamic MCQ Options Builder */}
      {type === 'mcq' && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-700">Multiple Choice Options</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                required
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOptionField(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addOptionField}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-700 pt-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Choice Option
          </button>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow transition-colors cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> + Add Question
        </button>
      </div>
    </form>
  );
}
