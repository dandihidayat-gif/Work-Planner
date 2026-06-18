import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setForgotMsg(null)
    if (!email) { setForgotMsg({ type: 'error', text: 'Masukkan email kamu terlebih dahulu.' }); return }
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setForgotLoading(false)
    if (error) setForgotMsg({ type: 'error', text: error.message })
    else setForgotMsg({ type: 'success', text: `Link reset password sudah dikirim ke ${email}. Cek inbox kamu.` })
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <img src="/images/auth-illustration.png" alt="" className="auth-visual-img" />
          <h1>Rencanakan konten, satu kalender untuk semua project.</h1>
          <p>Atur jadwal posting, pantau status publikasi, dan kelola to-do list tim kreatif kamu dalam satu tempat.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/icons/logo.svg" alt="TALJER" />
            TALJER
          </div>

          {!forgotMode ? (
            <>
              <h2>Masuk ke akun kamu</h2>
              <p className="sub">Kelola jadwal konten dan to-do list project kamu.</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input type="email" className="field-input" placeholder="nama@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <label className="field-label" style={{ margin: 0 }}>Password</label>
                    <button type="button" onClick={() => setForgotMode(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      Lupa password?
                    </button>
                  </div>
                  <input type="password" className="field-input" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              <div className="auth-footer">
                Belum punya akun? <Link to="/signup">Daftar sekarang</Link>
              </div>
            </>
          ) : (
            <>
              <h2>Lupa Password</h2>
              <p className="sub">Masukkan email akun kamu dan kami akan mengirimkan link untuk membuat password baru.</p>

              {forgotMsg && (
                <div className={forgotMsg.type === 'error' ? 'auth-error' : 'auth-success'}>
                  {forgotMsg.text}
                </div>
              )}

              {!forgotMsg?.type === 'success' || forgotMsg?.type !== 'success' ? (
                <form onSubmit={handleForgot}>
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <input type="email" className="field-input" placeholder="nama@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={forgotLoading}>
                    {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  </button>
                </form>
              ) : null}

              <div className="auth-footer">
                <button type="button" onClick={() => { setForgotMode(false); setForgotMsg(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ← Kembali ke Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
