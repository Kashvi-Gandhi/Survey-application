import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'surveyor' // 🚨 FIX 1: Set default role to 'surveyor'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isStudentRole = formData.role === 'taker';
    
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Full name and email are required');
      return;
    }

    if (!isStudentRole && !formData.password.trim()) {
      setError('Password is required for instructor accounts');
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role
      };

      // Always include password if present
      if (formData.password) {
        registrationData.password = formData.password;
      }

      await register(registrationData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStudentRole = formData.role === 'taker';

  return (
    <div className="max-w-md mx-auto my-8 bg-white p-8 rounded-xl border border-slate-200 shadow-md space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full mb-2">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create Portal Account</h1>
        <p className="text-xs text-slate-500">Sign up to build, host, and evaluate assessments</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Account Role
          </label>
          <div className="relative">
            <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="surveyor">Instructor / Surveyor</option>
              <option value="taker">Student / Survey Taker</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Kashvi Gandhi"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* 🚨 FIX 2: Password input renders now because role is initialized to 'surveyor' */}
        {!isStudentRole && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow transition-colors cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}