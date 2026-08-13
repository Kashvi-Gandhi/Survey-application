import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { submitSurveyResponse } from '../services/surveyService';
import { ClipboardCheck, Star, Send, CheckCircle } from 'lucide-react';

export default function TakeSurvey() {
  const { id: surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Transform answers object into payload array
    const formattedAnswers = Object.keys(answers).map((qId) => ({
      question_id: qId,
      response_text: String(answers[qId])
    }));

    try {
      await submitSurveyResponse(surveyId, formattedAnswers);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit survey responses.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading assessment...</div>;
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-xl border border-slate-200 shadow-lg text-center space-y-4">
        <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Submission Received!</h2>
        <p className="text-sm text-slate-600">
          Thank you for completing the survey assessment. Your responses have been securely recorded.
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
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {survey?.questions?.map((q, idx) => (
          <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 text-sm">{idx + 1}.</span>
              <p className="text-sm font-semibold text-slate-800">{q.question_text}</p>
            </div>

            {/* Render Question Input based on Type */}
            {q.type === 'mcq' && q.options && (
              <div className="space-y-2 pl-5">
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      required
                      value={opt}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'rating' && (
              <div className="flex items-center gap-3 pl-5 pt-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      required
                      value={val}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="sr-only"
                    />
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        answers[q.id] >= val ? 'fill-amber-400 stroke-amber-500' : 'text-slate-300'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-500">{val}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <div className="pl-5">
                <textarea
                  rows="2"
                  required
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
            )}
          </div>
        ))}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-md shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting Answers...' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}