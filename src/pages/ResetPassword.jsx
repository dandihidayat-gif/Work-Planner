import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts access_token in hash when user clicks email link
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Supabase SDK auto-processes this, just wait for session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
        else setError('Link reset tidak valid atau sudah kadaluarsa. Silakan minta link baru.')
      })
    } else {
      // Also handle PKCE flow via onAuthStateChange
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setReady(true)
        }
      })
      return () => listener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      await supabase.auth.signOut()
      setSuccess(true)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <img src="/images/auth-illustration.png" alt="" className="auth-visual-img" />
          <h1>Reset password akunmu.</h1>
          <p>Buat password baru yang kuat untuk melindungi akunmu.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/icons/logo.svg" alt="TALJER" />
            TALJER
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={52} color="var(--success)" style={{ marginBottom: 16 }} />
              <h2 style={{ marginBottom: 8 }}>Password berhasil diubah!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
                Silakan login dengan password baru kamu.
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={() => navigate('/login')}
              >
                Login Sekarang
              </button>
            </div>
          ) : (
            <>
              <h2>Buat Password Baru</h2>
              <p className="sub">Masukkan password baru untuk akunmu.</p>

              {error && <div className="auth-error">{error}</div>}

              {!ready && !error && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Memvalidasi link reset...</p>
              )}

              {ready && (
                <form onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNew ? 'text' : 'password'}
                        className="field-input"
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ paddingRight: 44 }}
                        required
                      />
                      <button type="button" onClick={() => setShowNew(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className="field-input"
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{ paddingRight: 44 }}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Set Password Baru'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
