import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'
import { Eye, EyeOff, X, Camera } from 'lucide-react'

export default function AccountSettingsModal({ onClose }) {
  const { user } = useAuth()
  const email = user?.email || ''
  const fullName = user?.user_metadata?.full_name || ''
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.user_metadata?.avatar_url || null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState(null)

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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarSave = async () => {
    if (!avatarFile) return
    setAvatarLoading(true)
    setAvatarMsg(null)
    const ext = avatarFile.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('project-logos').upload(path, avatarFile, { upsert: true })
    if (uploadError) { setAvatarMsg({ type: 'error', text: uploadError.message }); setAvatarLoading(false); return }
    const { data } = supabase.storage.from('project-logos').getPublicUrl(path)
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
    setAvatarLoading(false)
    if (error) setAvatarMsg({ type: 'error', text: error.message })
    else setAvatarMsg({ type: 'success', text: 'Foto profil berhasil diperbarui.' })
  }

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
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: 'Password berhasil diubah.' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  const handleForgotPassword = async () => {
    setForgotMsg(null)
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setForgotLoading(false)
    if (error) setForgotMsg({ type: 'error', text: error.message })
    else setForgotMsg({ type: 'success', text: `Link reset dikirim ke ${email}.` })
  }

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 className="modal-title" style={{ margin: 0 }}>Account Settings</h3>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>

          {/* PROFILE PHOTO */}
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div className="account-avatar">
              {avatarPreview
                ? <img src={avatarPreview} alt="" />
                : <span>{initials}</span>}
            </div>
            <div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Camera size={14} /> Ganti Foto
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
              {avatarFile && (
                <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={handleAvatarSave} disabled={avatarLoading}>
                  {avatarLoading ? 'Menyimpan...' : 'Simpan Foto'}
                </button>
              )}
            </div>
          </div>
          {avatarMsg && <div className={avatarMsg.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginBottom: 12 }}>{avatarMsg.text}</div>}

          {/* NAME & EMAIL - disabled */}
          <div className="field-group">
            <label className="field-label">Nama</label>
            <input className="field-input" value={fullName} disabled style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }} />
          </div>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input className="field-input" value={email} disabled style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0' }} />

          {/* PASSWORD */}
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Password</div>
          <form onSubmit={handlePasswordSave}>
            {[
              { label: 'Current Password', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { label: 'New Password', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
              { label: 'Confirm Password', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
            ].map(({ label, value, set, show, toggle }) => (
              <div className="field-group" key={label}>
                <label className="field-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} className="field-input" value={value}
                    onChange={e => set(e.target.value)} style={{ paddingRight: 44 }} />
                  <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {msg && <div className={msg.type === 'error' ? 'auth-error' : 'auth-success'}>{msg.text}</div>}
            {forgotMsg && <div className={forgotMsg.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginTop: 8 }}>{forgotMsg.text}</div>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
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
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
