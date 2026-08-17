import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Database, PlusCircle, ShieldCheck, LogOut, User } from 'lucide-react';
import OxfordLogo from '../../assets/logo-oxford 1.svg';
import SBSLogo from '../../assets/logo-sbs 1.svg';

export default function Navbar() {
  const { user, isAuthenticated, logout, isSurveyor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Survey links are public respondent-facing forms, not workspace pages.
  if (location.pathname.startsWith('/survey/')) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#EAEFEF] via-[#E2E9F0] to-[#E2E8F0] px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Floating White Card Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-3 shadow-sm shadow-slate-200/50 border border-white">
          <div className="flex items-center justify-between">

            {/* Brand Logos + Title */}
            <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center justify-content w-[118px] h-14 bg-white rounded-lg border border-slate-200 gap-1.5">
                <img src={OxfordLogo} alt="Oxford Logo" className="h-14 w-14" />
                <img src={SBSLogo} alt="SBS Logo" className="h-14 w-14" />
              </div>
              <span className="text-2xl font-bold text-slate-900 hidden sm:inline">SurveyPoint</span>
            </Link>
            

            {/* Center Nav Links - Pill Navigation */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1 bg-slate-50 rounded-full px-2 py-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive('/dashboard')
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>

                {isSurveyor && (
                  <>
                    <Link
                      to="/banks"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive('/banks')
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Database className="w-4 h-4" /> Banks
                    </Link>

                    <Link
                      to="/create-survey"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive('/create-survey')
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" /> Create
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive('/admin')
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </Link>
                )}
              </div>
            )}

            {/* Right Side - User Profile & Auth Actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* User Profile Pill */}
                  <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">{user?.full_name || user?.email}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                      {user?.role || 'user'}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 text-sm font-medium bg-teal-700 hover:bg-teal-800 text-white rounded-full shadow-md transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
