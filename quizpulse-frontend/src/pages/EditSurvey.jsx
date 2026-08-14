import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { updateSurvey } from '../services/surveyService';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const response = await API.get(`/surveys/${id}`);
        const data = response.data.data;
        setSurvey(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
      } catch {
        setError('Unable to load this survey.');
      }
    };
    loadSurvey();
  }, [id]);

  const isLocked = survey?.has_responses || Number(survey?.response_count) > 0;
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLocked) return;
    try {
      setSaving(true);
      setError('');
      await updateSurvey(id, { title, description });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update survey.');
    } finally {
      setSaving(false);
    }
  };

  if (!survey && !error) return <div className="p-12 text-center text-sm text-slate-400">Loading survey...</div>;
  if (isLocked) return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Back to dashboard</Link>
      <div><h1 className="text-2xl font-bold text-slate-900">Edit Survey</h1><p className="text-sm text-slate-500">Update the survey title and participant instructions.</p></div>
      {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{error}</div>}
      {survey && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Survey Title</label><input required value={title} onChange={(event) => setTitle(event.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description / Instructions</label><textarea rows="4" value={description} onChange={(event) => setDescription(event.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      )}
    </div>
  );
}
