import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'
import { Eye, EyeOff, X } from 'lucide-react'

export default function AccountSettingsModal({ onClose }) {
  const { user } = useAuth()
  const email = user?.email || ''

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState(null)

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' })
      return
    }
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) {
      setLoading(false)
      setMsg({ type: 'error', text: 'Password saat ini salah.' })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Password berhasil diubah.' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  const handleForgotPassword = async () => {
    setForgotMsg(null)
    setForgotLoading(true)
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setForgotLoading(false)
    if (error) {
      setForgotMsg({ type: 'error', text: error.message })
    } else {
      setForgotMsg({ type: 'success', text: `Link reset password sudah dikirim ke ${email}. Cek inbox kamu.` })
    }
  }

  const fields = [
    { label: 'Current Password', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
    { label: 'New Password', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
    { label: 'Confirm Password', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
  ]

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 className="modal-title" style={{ margin: 0 }}>Account Settings</h3>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 22 }}>{email}</p>

          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Password</div>

          <form onSubmit={handlePasswordSave}>
            {fields.map(({ label, value, set, show, toggle }) => (
              <div className="field-group" key={label}>
                <label className="field-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    className="field-input"
                    value={value}
                    onChange={e => set(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {msg && <div className={msg.type === 'error' ? 'auth-error' : 'auth-success'}>{msg.text}</div>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleForgotPassword} disabled={forgotLoading}>
                {forgotLoading ? 'Mengirim...' : 'Lupa password?'}
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {forgotMsg && (
              <div className={forgotMsg.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginTop: 12 }}>
                {forgotMsg.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
