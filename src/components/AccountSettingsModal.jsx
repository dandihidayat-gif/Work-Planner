import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'
import { Camera, Eye, EyeOff, X } from 'lucide-react'

export default function AccountSettingsModal({ onClose }) {
  const { user } = useAuth()
  const fullName = user?.user_metadata?.full_name || ''
  const email = user?.email || ''
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  const [name, setName] = useState(fullName)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.user_metadata?.avatar_url || null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)

    let avatar_url = user?.user_metadata?.avatar_url || null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      await supabase.storage.from('project-logos').upload(path, avatarFile, { upsert: true })
      const { data } = supabase.storage.from('project-logos').getPublicUrl(path)
      avatar_url = data.publicUrl
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim(), avatar_url }
    })

    setProfileLoading(false)
    if (error) setProfileMsg({ type: 'error', text: error.message })
    else setProfileMsg({ type: 'success', text: 'Profil berhasil disimpan.' })
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }

    setPasswordLoading(true)

    // Re-authenticate first with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    })

    if (signInError) {
      setPasswordLoading(false)
      setPasswordMsg({ type: 'error', text: 'Password saat ini salah.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) setPasswordMsg({ type: 'error', text: error.message })
    else {
      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah.' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 className="modal-title" style={{ margin: 0 }}>Account Settings</h3>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>

          {/* PROFILE */}
          <form onSubmit={handleProfileSave}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Profile</div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div className="account-avatar">
                {avatarPreview
                  ? <img src={avatarPreview} alt="" />
                  : <span>{initials}</span>}
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Camera size={15} /> Change
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="field-group">
              <label className="field-label">Name</label>
              <input className="field-input" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" value={email} disabled style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }} />
            </div>

            {profileMsg && (
              <div className={profileMsg.type === 'error' ? 'auth-error' : 'auth-success'}>
                {profileMsg.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Menyimpan...' : 'Save Profile'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0' }} />

          {/* PASSWORD */}
          <form onSubmit={handlePasswordSave}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Password</div>

            {[
              { label: 'Current Password', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { label: 'New Password', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
              { label: 'Confirm Password', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
            ].map(({ label, value, set, show, toggle }) => (
              <div className="field-group" key={label}>
                <label className="field-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    className="field-input"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={label === 'Current Password' ? 'Enter current password' : label === 'New Password' ? 'Create new password' : 'Confirm new password'}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {passwordMsg && (
              <div className={passwordMsg.type === 'error' ? 'auth-error' : 'auth-success'}>
                {passwordMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                {passwordLoading ? 'Menyimpan...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
