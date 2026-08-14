import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { submitSurveyResponse } from '../services/surveyService';
import { ClipboardCheck, Star, Send, CheckCircle, User, Mail } from 'lucide-react';

const getQuestionType = (question) => {
  const type = String(question.type || question.question_type || '').trim().toLowerCase();
  const aliases = {
    mcq: 'mcq_single',
    multiple_choice: 'mcq_single',
    single_select: 'mcq_single',
    multi_select: 'mcq_multiple',
    one_line: 'text',
    textarea: 'text',
    open_ended: 'text',
    rate: 'rating'
  };
  return aliases[type] || type;
};

const parseOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options !== 'string' || !options.trim()) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function TakeSurvey() {
  const { id: surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [takingStep, setTakingStep] = useState('info'); // 'info' | 'survey' | 'submitted'
  const [takerInfo, setTakerInfo] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSurveyDetails = async () => {
      try {
        const res = await API.get(`/surveys/${surveyId}`);
        setSurvey(res.data.data);
      } catch (err) {
        setError('Assessment not found or no longer active.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyDetails();
  }, [surveyId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleChoiceChange = (questionId, option, checked) => {
    setAnswers((prev) => {
      const selected = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      return {
        ...prev,
        [questionId]: checked ? [...selected, option] : selected.filter((value) => value !== option)
      };
    });
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    if (!takerInfo.name.trim() || !takerInfo.email.trim()) {
      setError('Please provide your name and email to continue.');
      return;
    }
    setError('');
    setTakingStep('survey');
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const missingRequiredQuestion = survey?.questions?.find((question) => {
      if (!question.is_required) return false;
      const answer = answers[question.id];
      return Array.isArray(answer) ? answer.length === 0 : answer === undefined || String(answer).trim() === '';
    });
    if (missingRequiredQuestion) {
      setError('Please answer all required questions before submitting.');
      setSubmitting(false);
      return;
    }

    const formattedAnswers = Object.keys(answers).map((qId) => ({
      question_id: qId,
      response_text: Array.isArray(answers[qId]) ? JSON.stringify(answers[qId]) : String(answers[qId])
    }));

    try {
      await submitSurveyResponse(surveyId, formattedAnswers, takerInfo.name, takerInfo.email);
      setTakingStep('submitted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit survey responses.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading assessment...</div>;
  }

  if (takingStep === 'submitted') {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-xl border border-slate-200 shadow-lg text-center space-y-4">
        <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
        <p className="text-sm text-slate-600">
          Your survey responses have been submitted successfully, <strong>{takerInfo.name}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Survey Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <ClipboardCheck className="w-4 h-4" /> Public Assessment
        </div>
        <h1 className="text-2xl font-bold">{survey?.title || 'Survey Assessment'}</h1>
        {survey?.description && <p className="text-slate-300 text-sm">{survey.description}</p>}
        {takingStep === 'survey' && (
          <p className="text-indigo-300 text-sm">
            <strong>Participant:</strong> {takerInfo.name} ({takerInfo.email})
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Step 1: Participant Information */}
      {takingStep === 'info' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Participant Information</h2>
          <p className="text-sm text-slate-600 mb-6">
            Please provide your details below to begin the assessment. Your information will be used to track your responses and provide results.
          </p>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={takerInfo.name}
                  onChange={(e) => setTakerInfo({ ...takerInfo, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={takerInfo.email}
                  onChange={(e) => setTakerInfo({ ...takerInfo, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-md shadow transition-colors"
              >
                Start Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Survey Questions */}
      {takingStep === 'survey' && (
        <form onSubmit={handleSurveySubmit} className="space-y-4">
          {survey?.questions?.map((q, idx) => {
            const qType = getQuestionType(q);
            const parsedOptions = qType === 'true_false' ? ['True', 'False'] : qType === 'yes_no' ? ['Yes', 'No'] : parseOptions(q.options);

            return (
              <div key={q.id || idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-indigo-600 text-sm">{idx + 1}.</span>
                  <p className="text-sm font-semibold text-slate-800">{q.question_text}</p>
                </div>

                {['mcq_single', 'true_false', 'yes_no'].includes(qType) && (
                  <div className="space-y-2 pl-5">
                    {parsedOptions.length === 0 ? (
                      <p className="text-xs italic text-amber-600">No options available for this question.</p>
                    ) : (
                      parsedOptions.map((opt, oIdx) => {
                        const optionLabel = typeof opt === 'object' ? opt.option_text || opt.label || JSON.stringify(opt) : opt;
                        return (
                          <label key={oIdx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              required={q.is_required}
                              value={optionLabel}
                              checked={answers[q.id] === optionLabel}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{optionLabel}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {qType === 'mcq_multiple' && (
                  <div className="space-y-2 pl-5">
                    {parsedOptions.length === 0 ? (
                      <p className="text-xs italic text-amber-600">No options available for this question.</p>
                    ) : parsedOptions.map((opt, oIdx) => {
                      const optionLabel = typeof opt === 'object' ? opt.option_text || opt.label || JSON.stringify(opt) : opt;
                      const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(optionLabel);
                      return (
                        <label key={oIdx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                          <input type="checkbox" checked={selected} onChange={(e) => handleMultipleChoiceChange(q.id, optionLabel, e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <span>{optionLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Rating Questions */}
                {qType === 'rating' && (
                  <div className="flex items-center gap-3 pl-5 pt-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          required={q.is_required}
                          value={val}
                          checked={String(answers[q.id]) === String(val)}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="sr-only"
                        />
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            Number(answers[q.id]) >= val ? 'fill-amber-400 stroke-amber-500' : 'text-slate-300'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-500">{val}</span>
                      </label>
                    ))}
                  </div>
                )}

                {qType === 'text' && (
                  <div className="pl-5">
                    <textarea
                      rows="2"
                      required={q.is_required}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full p-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    ></textarea>
                  </div>
                )}

                {qType === 'numeric' && (
                  <div className="pl-5">
                    <input type="number" required={q.is_required} value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="Enter a number" className="w-full p-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setTakingStep('info')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              ← Back to Info
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-md shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Answers...' : 'Submit Assessment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
