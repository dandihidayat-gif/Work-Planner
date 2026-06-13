import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) {
      navigate('/onboarding')
    } else {
      setDone(true)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <img src="/images/auth-illustration.png" alt="" className="auth-visual-img" />
          <h1>Mulai kelola konten project kamu hari ini.</h1>
          <p>Buat akun gratis, tambahkan project pertama kamu, dan langsung jadwalkan postingan di kalender.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/icons/logo.png" alt="Content Planner" />
            Content Planner
          </div>

          {done ? (
            <>
              <h2>Cek email kamu</h2>
              <p className="sub">Kami sudah mengirim link konfirmasi ke <strong>{email}</strong>. Klik link tersebut untuk mengaktifkan akun.</p>
              <Link to="/login" className="btn btn-secondary btn-block">Kembali ke halaman masuk</Link>
            </>
          ) : (
            <>
              <h2>Buat akun baru</h2>
              <p className="sub">Gratis, tidak perlu kartu kredit.</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">Nama</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Nama kamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Password</label>
                  <input
                    type="password"
                    className="field-input"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Memproses...' : 'Daftar'}
                </button>
              </form>

              <div className="auth-footer">
                Sudah punya akun? <Link to="/login">Masuk</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
