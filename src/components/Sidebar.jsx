import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, CheckSquare, Plus, LogOut, Link2, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import AddProjectModal from './AddProjectModal'
import ProjectSettingsModal from './ProjectSettingsModal'

export default function Sidebar({ projects, onProjectsChange }) {
  const location = useLocation()
  const { user } = useAuth()
  const [showAddProject, setShowAddProject] = useState(false)
  const [settingsProject, setSettingsProject] = useState(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/icons/logo.png" alt="" />
        Content Planner
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
            {p.logo_url
              ? <img src={p.logo_url} alt={p.name} />
              : p.name.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ flex: 1 }}>{p.name}</span>
          <Settings size={14} className="project-settings-icon" />
        </div>
      ))}

      <div className="sidebar-bottom">
        <button className="btn btn-primary btn-block" onClick={() => setShowAddProject(true)}>
          <Plus size={17} /> New Project
        </button>
        <button className="btn btn-ghost btn-block" onClick={handleLogout}>
          <LogOut size={17} /> Logout
        </button>
      </div>

      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onCreated={() => {
            setShowAddProject(false)
            onProjectsChange()
          }}
        />
      )}

      {settingsProject && (
        <ProjectSettingsModal
          project={settingsProject}
          onClose={() => setSettingsProject(null)}
          onSaved={() => {
            setSettingsProject(null)
            onProjectsChange()
          }}
        />
      )}
    </div>
  )
}
