import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'

export default function ProjectSettingsModal({ project, onClose, onSaved }) {
  const { user } = useAuth()
  const [color, setColor] = useState(project.color)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let logo_url = project.logo_url

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('project-logos')
        .upload(path, file)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('project-logos').getPublicUrl(path)
      logo_url = urlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update({ color, logo_url })
      .eq('id', project.id)

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onSaved()
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Project Settings</h3>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Nama Project</label>
            <input className="field-input" value={project.name} disabled />
          </div>

          <div className="field-group">
            <label className="field-label">Ganti Logo / Icon</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="project-dot" style={{ width: 40, height: 40 }}>
                {project.logo_url
                  ? <img src={project.logo_url} alt="" />
                  : project.name.slice(0, 2).toUpperCase()}
              </div>
              <input
                type="file"
                accept="image/*"
                className="field-input"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Warna HEX</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 44, height: 44, padding: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              />
              <input
                className="field-input"
                placeholder="#3366FF"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  )
}
