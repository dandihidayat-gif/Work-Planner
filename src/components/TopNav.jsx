import React, { useState, useRef, useEffect } from 'react'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import AccountSettingsModal from './AccountSettingsModal'

export default function TopNav() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const ref = useRef(null)

  const fullName = user?.user_metadata?.full_name || ''
  const email = user?.email || ''
  const displayName = fullName || email.split('@')[0]
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()
  const avatar = user?.user_metadata?.avatar_url

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div className="top-nav">
        <div className="top-nav-welcome">
          Welcome <strong>{displayName}</strong>
        </div>

        <div className="top-nav-right" ref={ref}>
          <button className="top-nav-user" onClick={() => setOpen(v => !v)}>
            <div className="user-avatar-sm">
              {avatar ? <img src={avatar} alt="" /> : <span>{initials}</span>}
            </div>
            <div className="user-info" style={{ textAlign: 'right' }}>
              <div className="user-name">{displayName}</div>
              <div className="user-email">{email}</div>
            </div>
            <ChevronDown size={14} className={`dropdown-chevron ${open ? 'open' : ''}`} />
          </button>

          {open && (
            <div className="topnav-dropdown">
              <button className="dropdown-item" onClick={() => { setOpen(false); setShowAccount(true) }}>
                <User size={15} /> Account
              </button>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showAccount && (
        <AccountSettingsModal onClose={() => setShowAccount(false)} />
      )}
    </>
  )
}
