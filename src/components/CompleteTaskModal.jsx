import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import ModalPortal from './ModalPortal'

export default function CompleteTaskModal({ task, onClose, onCompleted }) {
  const [finalLink, setFinalLink] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        final_link: finalLink.trim() || null,
        completion_note: note.trim() || null,
      })
      .eq('id', task.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onCompleted()
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Task Complete</h3>

        {error && <div className="auth-error">{error}</div>}

        <div className="detail-row"><span className="detail-label">Task: </span><strong>{task.title}</strong></div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Final Link</label>
            <input
              className="field-input"
              placeholder="https://..."
              value={finalLink}
              onChange={(e) => setFinalLink(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Note</label>
            <input
              className="field-input"
              placeholder="Catatan penyelesaian task"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Mark as Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  )
}
