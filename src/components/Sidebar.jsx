import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, CheckSquare, Plus, Link2, Settings, FileDown } from 'lucide-react'
import AddProjectModal from './AddProjectModal'
import ProjectSettingsModal from './ProjectSettingsModal'
import ExportWorkReportModal from './ExportWorkReportModal'

export default function Sidebar({ projects, onProjectsChange }) {
  const location = useLocation()
  const [showAddProject, setShowAddProject] = useState(false)
  const [settingsProject, setSettingsProject] = useState(null)
  const [showExportWork, setShowExportWork] = useState(false)

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/icons/logo.svg" alt="TALJER" style={{ width: 34, height: 34 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', lineHeight: 1 }}>TALJER</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>Task List Manager</div>
        </div>
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

      <button className="nav-item" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', color: 'var(--primary)', fontWeight: 700 }}
        onClick={() => setShowExportWork(true)} disabled={projects.length === 0}>
        <FileDown size={17} /> Export Work Report
      </button>

      <div className="sidebar-bottom">
        <button className="btn btn-primary btn-block" onClick={() => setShowAddProject(true)}>
          <Plus size={17} /> New Project
        </button>
      </div>

      {showAddProject && (
        <AddProjectModal onClose={() => setShowAddProject(false)}
          onCreated={() => { setShowAddProject(false); onProjectsChange() }} />
      )}
      {settingsProject && (
        <ProjectSettingsModal project={settingsProject}
          onClose={() => setSettingsProject(null)}
          onSaved={() => { setSettingsProject(null); onProjectsChange() }}
          onDeleted={() => { setSettingsProject(null); onProjectsChange() }}
          onArchived={() => { setSettingsProject(null); onProjectsChange() }} />
      )}
      {showExportWork && (
        <ExportWorkReportModal projects={projects} onClose={() => setShowExportWork(false)} />
      )}
    </div>
  )
}
