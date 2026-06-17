import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, CheckSquare, Plus, LogOut, Link2, Settings, FileDown, Archive, User, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import AddProjectModal from './AddProjectModal'
import ProjectSettingsModal from './ProjectSettingsModal'
import ExportWorkReportModal from './ExportWorkReportModal'
import AccountSettingsModal from './AccountSettingsModal'
import ProjectArchiveModal from './ProjectArchiveModal'

export default function Sidebar({ projects, onProjectsChange }) {
  const location = useLocation()
  const { user } = useAuth()
  const [showAddProject, setShowAddProject] = useState(false)
  const [settingsProject, setSettingsProject] = useState(null)
  const [showExportWork, setShowExportWork] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const fullName = user?.user_metadata?.full_name || ''
  const email = user?.email || ''
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()
  const avatar = user?.user_metadata?.avatar_url

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header" ref={dropdownRef}>
        <button className="sidebar-user-btn" onClick={() => setDropdownOpen(v => !v)}>
          <div className="user-avatar-sm">
            {avatar ? <img src={avatar} alt="" /> : <span>{initials}</span>}
          </div>
          <div className="user-info">
            <div className="user-name">{fullName || email}</div>
            <div className="user-email">{fullName ? email : ''}</div>
          </div>
          <ChevronDown size={15} className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="sidebar-dropdown">
            <button className="dropdown-item" onClick={() => { setDropdownOpen(false); setShowAccount(true) }}>
              <User size={15} /> Account
            </button>
            <button className="dropdown-item" onClick={() => { setDropdownOpen(false); setShowArchive(true) }}>
              <Archive size={15} /> Project Archive
            </button>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <button className="dropdown-item danger" onClick={handleLogout}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>

      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Calendar size={18} /> Planner
      </Link>
      <Link to="/todo" className={`nav-item ${location.pathname === '/todo' ? 'active' : ''}`}>
        <CheckSquare size={18} /> To Do List
      </Link>
      <Link to="/links" className={`nav-item ${location.pathname === '/links' ? 'active' : ''}`}>
        <Link2 size={18} /> Link & Access
      </Link>

      <div className="sidebar-section-label">Projects</div>
      {projects.map((p) => (
        <div className="project-item" key={p.id} onClick={() => setSettingsProject(p)}>
          <div className="project-dot">
            {p.logo_url ? <img src={p.logo_url} alt={p.name} /> : p.name.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ flex: 1 }}>{p.name}</span>
          <Settings size={14} className="project-settings-icon" />
        </div>
      ))}

      <button
        className="nav-item"
        style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', marginTop: 4, color: 'var(--primary)', fontWeight: 700 }}
        onClick={() => setShowExportWork(true)}
        disabled={projects.length === 0}
      >
        <FileDown size={17} /> Export Work Report
      </button>

      <div className="sidebar-bottom">
        <button className="btn btn-primary btn-block" onClick={() => setShowAddProject(true)}>
          <Plus size={17} /> New Project
        </button>
      </div>

      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onCreated={() => { setShowAddProject(false); onProjectsChange() }}
        />
      )}
      {settingsProject && (
        <ProjectSettingsModal
          project={settingsProject}
          onClose={() => setSettingsProject(null)}
          onSaved={() => { setSettingsProject(null); onProjectsChange() }}
          onDeleted={() => { setSettingsProject(null); onProjectsChange() }}
          onArchived={() => { setSettingsProject(null); onProjectsChange() }}
        />
      )}
      {showExportWork && (
        <ExportWorkReportModal projects={projects} onClose={() => setShowExportWork(false)} />
      )}
      {showAccount && (
        <AccountSettingsModal onClose={() => setShowAccount(false)} />
      )}
      {showArchive && (
        <ProjectArchiveModal
          onClose={() => setShowArchive(false)}
          onRestored={() => onProjectsChange()}
        />
      )}
    </div>
  )
}
