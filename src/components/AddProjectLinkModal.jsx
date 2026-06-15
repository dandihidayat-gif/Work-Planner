import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'

export default function AddProjectLinkModal({ projects, linkTypes, onClose, onSaved }) {
  const { user } = useAuth()
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [linkTypeId, setLinkTypeId] = useState(linkTypes[0]?.id || '')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!projectId || !linkTypeId || !url.trim()) {
      setError('Mohon lengkapi Project, Jenis Link, dan URL.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('project_links').insert({
      user_id: user.id,
      project_id: projectId,
      link_type_id: linkTypeId,
      url: url.trim(),
      notes: notes.trim() || null,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add Link</h3>

        {error && <div className="auth-error">{error}</div>}

        {linkTypes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Belum ada Link Type. Tambahkan Link Type terlebih dahulu di tab "Link Type".
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Project</label>
              <select className="field-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Jenis Link</label>
              <select className="field-select" value={linkTypeId} onChange={(e) => setLinkTypeId(e.target.value)}>
                {linkTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">URL</label>
              <input
                className="field-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Catatan (opsional)</label>
              <input
                className="field-input"
                placeholder="Contoh: Akun utama, password di Bitwarden"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  )
}
