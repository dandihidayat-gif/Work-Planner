import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Trash2 } from 'lucide-react'

export default function AddTaskModal({ projects, onClose, onSaved }) {
  const { user } = useAuth()
  const [projectId, setProjectId] = useState('')
  const [taskName, setTaskName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [noDeadline, setNoDeadline] = useState(false)
  const [links, setLinks] = useState([{ label: '', url: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateLink = (i, field, value) => {
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const addLink = () => {
    if (links.length < 3) setLinks((prev) => [...prev, { label: '', url: '' }])
  }

  const removeLink = (i) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!projectId || !taskName.trim()) {
      setError('Mohon pilih project dan isi nama task.')
      return
    }
    if (!noDeadline && !deadline) {
      setError('Pilih tanggal deadline atau centang No Deadline.')
      return
    }
    setLoading(true)

    // get current max sort_order
    const { data: existing } = await supabase
      .from('tasks')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        title: taskName.trim(),
        deadline: noDeadline ? null : deadline,
        no_deadline: noDeadline,
        status: 'pending',
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (taskError) {
      setLoading(false)
      setError(taskError.message)
      return
    }

    const validLinks = links.filter((l) => l.url.trim())
    if (validLinks.length > 0) {
      const { error: linkError } = await supabase.from('task_links').insert(
        validLinks.map((l) => ({ task_id: task.id, label: l.label.trim() || null, url: l.url.trim() }))
      )
      if (linkError) {
        setLoading(false)
        setError(linkError.message)
        return
      }
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add Task</h3>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <select className="field-select" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Pilih Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <input
              className="field-input"
              placeholder="Nama task"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <input
              type="date"
              className="field-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={noDeadline}
            />
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="no-deadline"
              checked={noDeadline}
              onChange={(e) => setNoDeadline(e.target.checked)}
            />
            <label htmlFor="no-deadline">No Deadline</label>
          </div>

          {links.map((link, i) => (
            <div className="link-row" key={i}>
              <input
                className="field-input"
                placeholder="Nama Link"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
              />
              <input
                className="field-input"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
              />
              {i > 0 && (
                <button type="button" className="link-remove" onClick={() => removeLink(i)}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <div className="modal-actions split">
            {links.length < 3 ? (
              <button type="button" className="btn btn-secondary" onClick={addLink}>+ Tambah Link</button>
            ) : <span />}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
