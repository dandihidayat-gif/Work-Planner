import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { CONTENT_TYPES } from '../lib/constants'
import ModalPortal from './ModalPortal'

export default function AddPostScheduleModal({ projects, defaultDate, onClose, onSaved }) {
  const { user } = useAuth()
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [date, setDate] = useState(defaultDate || '')
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('Feed')
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const togglePlatform = (p) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!projectId || !date || !title.trim()) {
      setError('Mohon lengkapi Project, Tanggal, dan Judul Konten.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('post_schedules').insert({
      user_id: user.id,
      project_id: projectId,
      title: title.trim(),
      post_date: date,
      content_type: contentType,
      platforms,
      status: 'unposted',
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
        <h3 className="modal-title">Add Post Schedule</h3>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Project</label>
            <select className="field-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Tanggal</label>
            <input
              type="date"
              className="field-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Judul Konten</label>
            <input
              className="field-input"
              placeholder="Contoh: Promo Google Ads"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Tipe Konten</label>
            <select className="field-select" value={contentType} onChange={(e) => setContentType(e.target.value)}>
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Platform</label>
            <div className="checkbox-grid">
              {['Instagram', 'TikTok', 'Facebook', 'LinkedIn'].map((p) => (
                <label key={p}>
                  <input
                    type="checkbox"
                    checked={platforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  )
}
