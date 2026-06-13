import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'

export default function AddProjectModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3366FF')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let logo_url = null

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

    const { error: insertError } = await supabase.from('projects').insert({
      user_id: user.id,
      name: name.trim(),
      color,
      logo_url,
    })

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onCreated()
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add Project</h3>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Logo / Icon</label>
            <input
              type="file"
              accept="image/*"
              className="field-input"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Nama Project</label>
            <input
              className="field-input"
              placeholder="Contoh: Luna Creative"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Warna HEX</label>
            <input
              className="field-input"
              placeholder="#3366FF"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  )
}
