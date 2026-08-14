import React from 'react';
import { HelpCircle, Star, AlignLeft, CheckSquare, Trash2 } from 'lucide-react';

export default function QuestionCard({ question, onDelete }) {
  const { question_text, options } = question;
  const type = question.type || question.question_type;

  const getTypeBadge = () => {
    switch (type) {
      case 'mcq_single':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><CheckSquare className="w-3 h-3"/> MCQ Single Select</span>;
      case 'mcq_multiple':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><CheckSquare className="w-3 h-3"/> MCQ Multiple Select</span>;
      case 'true_false':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800"><CheckSquare className="w-3 h-3"/> True / False</span>;
      case 'yes_no':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800"><CheckSquare className="w-3 h-3"/> Yes / No</span>;
      case 'rating':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Star className="w-3 h-3"/> Rating</span>;
      case 'text':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><AlignLeft className="w-3 h-3"/> Text</span>;
      case 'numeric':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><AlignLeft className="w-3 h-3"/> Numeric</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800"><HelpCircle className="w-3 h-3"/> General</span>;
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getTypeBadge()}
          </div>
          <p className="text-sm font-semibold text-slate-800">{question_text}</p>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(question.id)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Render Options Preview based on Question Type */}
      {['mcq', 'mcq_single', 'mcq_multiple', 'true_false', 'yes_no'].includes(type) && options && Array.isArray(options) && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt, idx) => (
            <div key={idx} className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
              <span className="font-bold text-slate-400 mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
            </div>
          ))}
        </div>
      )}

      {type === 'rating' && (
        <div className="mt-3 flex items-center gap-1 text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-4 h-4 fill-amber-300 stroke-amber-500" />
          ))}
          <span className="text-xs text-slate-500 ml-2">(1 to 5 scale)</span>
        </div>
      )}

      {type === 'text' && (
        <div className="mt-3 p-2 bg-slate-50 border border-dashed border-slate-300 rounded text-xs text-slate-400 italic">
          Text response input placeholder...
        </div>
      )}
    </div>
  );
}
