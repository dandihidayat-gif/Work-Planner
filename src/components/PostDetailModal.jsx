import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PLATFORM_ICONS } from '../lib/constants'
import { ExternalLink, Trash2 } from 'lucide-react'

export default function PostDetailModal({ post, project, onClose, onSaved, onDeleted }) {
  const [status, setStatus] = useState(post.status)
  const [link, setLink] = useState(post.post_link || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (status === 'posted' && !link.trim()) {
      setError('Link posting wajib diisi jika status Posted.')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('post_schedules')
      .update({ status, post_link: status === 'posted' ? link.trim() : null })
      .eq('id', post.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  const handleDelete = async () => {
    if (post.status === 'posted') return
    if (!window.confirm('Hapus jadwal posting ini?')) return
    setLoading(true)
    const { error } = await supabase.from('post_schedules').delete().eq('id', post.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onDeleted()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-project">
            <div className="project-dot" style={{ background: project?.color, width: 30, height: 30 }}>
              {project?.logo_url
                ? <img src={project.logo_url} alt="" />
                : project?.name.slice(0, 2).toUpperCase()}
            </div>
            {project?.name}
          </div>
          <div className="platform-icons">
            {(post.platforms || []).map((p) => (
              <img key={p} src={PLATFORM_ICONS[p]} alt={p} title={p} />
            ))}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="detail-row"><span className="detail-label">Judul: </span><strong>{post.title}</strong></div>
        <div className="detail-row"><span className="detail-label">Tanggal: </span><strong>{post.post_date}</strong></div>
        <div className="detail-row"><span className="detail-label">Tipe Konten: </span>{post.content_type}</div>

        <form onSubmit={handleSave}>
          <div className="field-group">
            <label className="field-label">Link Posting</label>
            <input
              className="field-input"
              placeholder="https://instagram.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={post.status === 'posted'}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Status</label>
            <select
              className="field-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={post.status === 'posted'}
            >
              <option value="unposted">Unposted</option>
              <option value="posted">Posted</option>
            </select>
          </div>

          {post.status === 'posted' && post.post_link && (
            <a
              href={post.post_link}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-block"
              style={{ marginBottom: 12 }}
            >
              <ExternalLink size={16} /> Go to Postingan
            </a>
          )}

          <div className="modal-actions split">
            {post.status === 'unposted' ? (
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                <Trash2 size={16} /> Delete
              </button>
            ) : <span />}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              {post.status === 'unposted' && (
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
