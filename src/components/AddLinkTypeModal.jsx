import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ModalPortal from './ModalPortal'

export default function AddLinkTypeModal({ onClose, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nama link type wajib diisi.')
      return
    }
    setLoading(true)

    let icon_url = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('link-type-icons')
        .upload(path, file)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('link-type-icons').getPublicUrl(path)
      icon_url = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('link_types').insert({
      user_id: user.id,
      name: name.trim(),
      icon_url,
    })

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onSaved()
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">New Link Type</h3>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Nama Link Type</label>
            <input
              className="field-input"
              placeholder="Contoh: Instagram, Google Drive, Figma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Icon</label>
            <input
              type="file"
              accept="image/*"
              className="field-input"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Add Link Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  )
}
