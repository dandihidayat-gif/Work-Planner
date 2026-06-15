import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ExternalLink } from 'lucide-react'
import ModalPortal from './ModalPortal'

export default function TaskDetailModal({ task, project, onClose }) {
  const [links, setLinks] = useState([])

  useEffect(() => {
    supabase.from('task_links').select('*').eq('task_id', task.id).then(({ data }) => {
      setLinks(data || [])
    })
  }, [task.id])

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-project">
            <div className="project-dot" style={{ width: 30, height: 30 }}>
              {project?.logo_url
                ? <img src={project.logo_url} alt="" />
                : project?.name.slice(0, 2).toUpperCase()}
            </div>
            {project?.name}
          </div>
          <span className={`status-badge status-${task.status}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>

        <div className="detail-row"><span className="detail-label">Task: </span><strong>{task.title}</strong></div>
        <div className="detail-row">
          <span className="detail-label">Deadline: </span>
          {task.no_deadline ? 'No Deadline' : task.deadline}
        </div>
        <div className="detail-row">
          <span className="detail-label">Completion Date: </span>
          {task.completed_at || '-'}
        </div>

        {links.length > 0 && (
          <div className="field-group" style={{ marginTop: 18 }}>
            <label className="field-label">Links</label>
            {links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-block"
                style={{ marginBottom: 8, justifyContent: 'space-between' }}
              >
                {l.label || l.url}
                <ExternalLink size={15} />
              </a>
            ))}
          </div>
        )}

        {task.status === 'done' && (task.final_link || task.completion_note) && (
          <div className="field-group" style={{ marginTop: 18 }}>
            <label className="field-label">Final Link & Note</label>
            {task.final_link && (
              <a
                href={task.final_link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-block"
                style={{ marginBottom: 8, justifyContent: 'space-between' }}
              >
                {task.final_link}
                <ExternalLink size={15} />
              </a>
            )}
            {task.completion_note && (
              <div className="detail-row" style={{ marginTop: task.final_link ? 0 : 8 }}>
                {task.completion_note}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
