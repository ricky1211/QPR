'use client'

import React, { useActionState, useState, useEffect } from 'react'
import Image from 'next/image'
import { loginAction, LoginState } from '@/app/actions/auth'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react'

// ============================================================
// Initial state for useActionState
// ============================================================
const initialState: LoginState = { error: null }

// ============================================================
// Login Page Component
// ============================================================
export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'signin' | 'quickaccess'>('signin')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* ── Global styles scoped to login page ─────────────── */}
      <style>{`
        /* Override global table/border rules for login page only */
        .login-root table { border: none !important; }
        .login-root [class*="border-slate-"] { border-color: #e2e8f0 !important; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(29,78,216,.4); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 8px rgba(29,78,216,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(29,78,216,0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }

        .card-enter {
          animation: fadeInUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .logo-float {
          animation: float 4s ease-in-out infinite;
        }
        .btn-shimmer {
          background: linear-gradient(
            90deg,
            #1d4ed8 0%,
            #2563eb 40%,
            #3b82f6 60%,
            #2563eb 80%,
            #1d4ed8 100%
          );
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        .btn-shimmer:disabled {
          animation: none;
          background: #93c5fd;
          cursor: not-allowed;
        }
        .input-focus-ring:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.18);
        }
        .tab-active {
          color: #1d4ed8;
          border-bottom: 2.5px solid #2563eb;
          background: rgba(239,246,255,0.6);
          border-radius: 6px 6px 0 0;
        }
        .tab-inactive {
          color: #94a3b8;
          border-bottom: 2.5px solid transparent;
          border-radius: 6px 6px 0 0;
        }
        .tab-inactive:hover {
          color: #475569;
          background: rgba(248,250,252,0.8);
        }

        /* Backdrop blur + gradient overlay */
        .bg-overlay {
          background: linear-gradient(
            135deg,
            rgba(15,23,42,0.55) 0%,
            rgba(15,23,42,0.35) 100%
          );
        }

        /* Glassmorphism card */
        .glass-card {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        /* Error shake */
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-5px); }
          40%,80%  { transform: translateX( 5px); }
        }
        .error-shake { animation: shake .35s ease; }
      `}</style>

      {/* ── Full-screen layout ──────────────────────────────── */}
      <div
        className="login-root relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        style={{ fontFamily: '"Google Sans", "Product Sans", sans-serif' }}
      >
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/mtm-factory.jpg"
            alt="PT Menara Terus Makmur Factory"
            fill
            priority
            quality={90}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
          <div className="bg-overlay absolute inset-0" />
        </div>

        {/* Floating decorative circles */}
        <div
          className="absolute top-12 left-12 h-56 w-56 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent)',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-16 right-16 h-72 w-72 rounded-full opacity-8"
          style={{
            background: 'radial-gradient(circle, #6366f1, transparent)',
            animation: 'float 8s ease-in-out infinite reverse',
          }}
        />

        {/* ── Login Card ──────────────────────────────────────── */}
        <div
          className={`glass-card relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
            ${mounted ? 'card-enter' : 'opacity-0'}`}
          style={{
            boxShadow: '0 32px 64px rgba(0,0,0,.32), 0 0 0 1px rgba(255,255,255,.15)',
          }}
        >
          {/* Top colour bar */}
          <div
            className="h-1 w-full"
            style={{
              background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6, #0284c7)',
            }}
          />

          {/* Card body */}
          <div className="px-10 pt-8 pb-9">

            {/* Logo + heading */}
            <div className="flex flex-col items-center mb-6">
              <div className="logo-float mb-3">
                <Image
                  src="/logo-mtm.png"
                  alt="MTM — Menara Terus Makmur"
                  width={210}
                  height={60}
                  priority
                  style={{ objectFit: 'contain', height: 'auto' }}
                />
              </div>
              <div className="mt-1 text-center">
                <h1
                  className="text-sm font-extrabold tracking-widest uppercase"
                  style={{ color: '#0f172a', letterSpacing: '0.18em' }}
                >
                  QPR SYSTEM
                </h1>
                <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                  Sistem Quality Problem Report PT Menara Terus Makmur
                </p>
              </div>
            </div>

            {/* Tabs: Sign In | Quick Access — centered & compact */}
            <div className="flex justify-center border-b border-slate-100 mb-5">
              <button
                type="button"
                id="tab-signin"
                className={`flex-1 py-2 text-[12px] font-bold transition-all text-center ${activeTab === 'signin' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-quickaccess"
                className={`flex-1 py-2 text-[12px] font-bold transition-all text-center ${activeTab === 'quickaccess' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setActiveTab('quickaccess')}
              >
                Quick Access
              </button>
            </div>

            {/* Sign In Form */}
            {activeTab === 'signin' && (
              <form action={formAction} id="login-form" noValidate>

                {/* Error alert */}
                {state?.error && (
                  <div
                    className="error-shake flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-lg border"
                    style={{
                      background: '#fef2f2',
                      borderColor: '#fca5a5',
                    }}
                  >
                    <AlertCircle
                      size={15}
                      className="shrink-0 mt-0.5"
                      style={{ color: '#dc2626' }}
                    />
                    <p className="text-xs font-semibold" style={{ color: '#b91c1c' }}>
                      {state.error}
                    </p>
                  </div>
                )}

                {/* Username field */}
                <div className="mb-4">
                  <label
                    htmlFor="username"
                    className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
                    style={{ color: '#64748b' }}
                  >
                    Username / NPK
                  </label>
                  <div
                    className="input-focus-ring flex items-center gap-2.5 px-3.5 rounded-lg border transition-all"
                    style={{
                      borderColor: '#e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <User size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      defaultValue="admin"
                      placeholder="Masukkan username atau NPK"
                      required
                      className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-300 font-medium"
                      style={{ color: '#0f172a' }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="mb-6">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
                    style={{ color: '#64748b' }}
                  >
                    Password
                  </label>
                  <div
                    className="input-focus-ring flex items-center gap-2.5 px-3.5 rounded-lg border transition-all"
                    style={{
                      borderColor: '#e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <Lock size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      defaultValue="password123"
                      placeholder="Masukkan password"
                      required
                      className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-300 font-medium"
                      style={{ color: '#0f172a' }}
                    />
                    <button
                      type="button"
                      id="toggle-password"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="p-1 rounded transition-colors hover:bg-slate-100"
                      style={{ color: '#94a3b8' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="btn-login"
                  disabled={isPending}
                  className="btn-shimmer w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg font-bold text-sm text-white transition-all"
                  style={{ minHeight: 48 }}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Memverifikasi…
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      Masuk
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Access tab placeholder */}
            {activeTab === 'quickaccess' && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#eff6ff' }}
                >
                  <Zap size={26} style={{ color: '#2563eb' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#1e293b' }}>
                  Quick Access
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#94a3b8', maxWidth: 240 }}>
                  Fitur ini belum tersedia. Silakan gunakan tab{' '}
                  <button
                    type="button"
                    className="font-bold underline"
                    style={{ color: '#2563eb' }}
                    onClick={() => setActiveTab('signin')}
                  >
                    Sign In
                  </button>{' '}
                  untuk masuk.
                </p>
              </div>
            )}

            {/* Footer */}
            <p
              className="mt-7 text-center text-[10px] font-medium"
              style={{ color: '#cbd5e1' }}
            >
              © {new Date().getFullYear()} PT Menara Terus Makmur
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
