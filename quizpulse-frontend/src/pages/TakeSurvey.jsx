import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { submitSurveyResponse } from '../services/surveyService';
import { ClipboardCheck, Star, Send, CheckCircle, User, Mail, ChevronRight, Download } from 'lucide-react';

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
  const [takingStep, setTakingStep] = useState('info');
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

  const exportMyAnswers = () => {
    if (!survey?.questions || survey.questions.length === 0) {
      alert('No answers available to export yet.');
      return;
    }

    const rows = survey.questions.map((question) => {
      const rawAnswer = answers[question.id];
      const answerValue = Array.isArray(rawAnswer)
        ? rawAnswer.join(', ')
        : rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === ''
          ? 'No answer provided'
          : String(rawAnswer);

      return {
        'Participant Name': takerInfo.name || 'Anonymous',
        Email: takerInfo.email || 'N/A',
        'Question': question.question_text || question.text || 'Untitled Question',
        'Question Type': question.question_type || question.type || 'N/A',
        'Answer': answerValue
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Survey Answers');
    XLSX.writeFile(workbook, `${(survey.title || 'survey').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-my-answers.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm shadow-slate-300/40 border border-slate-100 inline-block">
          <p className="text-slate-500 text-sm">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (takingStep === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm shadow-slate-300/40 border border-slate-100 text-center space-y-4">
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
          <p className="text-sm text-slate-600">
            Your survey responses have been submitted successfully, <strong>{takerInfo.name}</strong>.
          </p>

          <button
            type="button"
            onClick={exportMyAnswers}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B6280] hover:bg-[#2C4B63] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors mx-auto"
          >
            <Download className="w-4 h-4" /> Download My Answers (.xlsx)
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = survey?.questions?.length || 0;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-3">
      {/* Error Alert */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Assessment Info Box */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{survey?.title || 'Survey Assessment'}</h1>
            <p className="text-slate-600 mt-2">{survey?.description || 'Enter your basic information before starting the assessment.'}</p>
            {takingStep === 'survey' && totalQuestions > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-900">{answeredQuestions}</span>
                  <span className="text-slate-600">of {totalQuestions} answered</span>
                </div>
                <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
            {takingStep === 'info' ? 'STEP 1: INFO' : `STEP 2: QUESTIONS (${totalQuestions})`}
          </div>
        </div>
      </div>

      {/* Content Box */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 p-6">
        
        {/* Step 1: Participant Information */}
        {takingStep === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-5">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Participant Information</h2>
              <p className="text-sm text-slate-600 mt-1">Please provide your details below to begin the assessment.</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={takerInfo.name}
                onChange={(e) => setTakerInfo({ ...takerInfo, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Email Address <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                required
                value={takerInfo.email}
                onChange={(e) => setTakerInfo({ ...takerInfo, email: e.target.value })}
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3B6280] hover:bg-[#2C4B63] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                Continue to Questions
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Survey Questions */}
        {takingStep === 'survey' && (
          <form onSubmit={handleSurveySubmit} className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Answer the Questions</h2>
              <p className="text-sm text-slate-600 mt-1">Participant: <strong>{takerInfo.name}</strong> ({takerInfo.email})</p>
            </div>

            {/* Questions */}
            {survey?.questions?.map((q, idx) => {
              const qType = getQuestionType(q);
              const parsedOptions = qType === 'true_false' ? ['True', 'False'] : qType === 'yes_no' ? ['Yes', 'No'] : parseOptions(q.options);

              return (
                <div key={q.id || idx} className="pb-6 border-b border-slate-100 last:border-0">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 pt-1">
                      {q.question_text}
                      {q.is_required && <span className="text-red-600 ml-1">*</span>}
                    </p>
                  </div>

                  {/* Single Choice */}
                  {['mcq_single', 'true_false', 'yes_no'].includes(qType) && (
                    <div className="space-y-2 ml-11">
                      {parsedOptions.length === 0 ? (
                        <p className="text-xs italic text-amber-600">No options available for this question.</p>
                      ) : (
                        parsedOptions.map((opt, oIdx) => {
                          const optionLabel = typeof opt === 'object' ? opt.option_text || opt.label || JSON.stringify(opt) : opt;
                          return (
                            <label key={oIdx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                required={q.is_required}
                                value={optionLabel}
                                checked={answers[q.id] === optionLabel}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                className="text-teal-600"
                              />
                              <span>{optionLabel}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {qType === 'mcq_multiple' && (
                    <div className="space-y-2 ml-11">
                      {parsedOptions.length === 0 ? (
                        <p className="text-xs italic text-amber-600">No options available for this question.</p>
                      ) : (
                        parsedOptions.map((opt, oIdx) => {
                          const optionLabel = typeof opt === 'object' ? opt.option_text || opt.label || JSON.stringify(opt) : opt;
                          const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(optionLabel);
                          return (
                            <label key={oIdx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => handleMultipleChoiceChange(q.id, optionLabel, e.target.checked)}
                                className="rounded text-teal-600"
                              />
                              <span>{optionLabel}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Rating */}
                  {qType === 'rating' && (
                    <div className="flex items-center gap-4 ml-11 pt-2">
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
                            className={`w-7 h-7 transition-colors cursor-pointer ${
                              Number(answers[q.id]) >= val ? 'fill-amber-400 stroke-amber-500' : 'text-slate-300 hover:text-amber-300'
                            }`}
                          />
                          <span className="text-xs font-semibold text-slate-500">{val}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Text */}
                  {qType === 'text' && (
                    <div className="ml-11">
                      <textarea
                        rows="2"
                        required={q.is_required}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      ></textarea>
                    </div>
                  )}

                  {/* Numeric */}
                  {qType === 'numeric' && (
                    <div className="ml-11">
                      <input
                        type="number"
                        required={q.is_required}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Enter a number"
                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setTakingStep('info')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                ← Back to Info
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#3B6280] hover:bg-[#2C4B63] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
