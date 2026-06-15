import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'
import { Trash2 } from 'lucide-react'

export default function ProjectSettingsModal({ project, onClose, onSaved, onDeleted }) {
  const { user } = useAuth()
  const [color, setColor] = useState(project.color)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Hapus project "${project.name}"? Semua jadwal posting, task, dan link yang terkait dengan project ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`
    )
    if (!confirmed) return

    setError('')
    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)

    setDeleting(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    onDeleted()
  }

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

          <div className="modal-actions split">
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting || loading}>
              <Trash2 size={16} /> {deleting ? 'Menghapus...' : 'Delete Project'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || deleting}>
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
