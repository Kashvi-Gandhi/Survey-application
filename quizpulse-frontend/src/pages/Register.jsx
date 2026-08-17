import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'surveyor'
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
    <div className="min-h-screen bg-gradient-to-b from-[#EAEFEF] via-[#E2E9F0] to-[#E2E8F0] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-300/40 border border-slate-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="px-6 py-8 bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-100 text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3.5 bg-teal-100 rounded-2xl text-teal-700">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create Portal Account</h1>
            <p className="text-sm text-slate-600">Sign up to build, host, and evaluate assessments</p>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Account Role */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                  Account Role
                </label>
                <div className="relative">
                  <ShieldCheck className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="surveyor">Instructor / Surveyor</option>
                    <option value="taker">Student / Survey Taker</option>
                  </select>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Kashvi Gandhi"
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Password - Only for non-student roles */}
              {!isStudentRole && (
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#3B6280] hover:bg-[#2C4B63] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>

            {/* Signin Link */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
