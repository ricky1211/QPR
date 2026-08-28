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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* ── Global styles scoped to login page ─────────────── */}
      <style>{`
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

        .bg-overlay {
          background: linear-gradient(
            135deg,
            rgba(15,23,42,0.55) 0%,
            rgba(15,23,42,0.35) 100%
          );
        }

        .glass-card {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

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
            ${mounted ? 'card-enter' : ''}`}
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
            <div className="flex flex-col items-center mb-8">
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

            {/* Sign In Form */}
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

              {/* ID / NPK field */}
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
                  style={{ color: '#64748b' }}
                >
                  ID / NPK Karyawan
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
                    placeholder="Masukkan ID atau NPK Anda"
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
                    Masuk ke Sistem
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p
              className="mt-7 text-center text-[10px] font-medium"
              style={{ color: '#cbd5e1' }}
            >
              © {new Date().getFullYear()} PT Menara Terus Makmur · Sistem QPR Internal
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
