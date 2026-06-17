import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ModalPortal from './ModalPortal'
import { ArchiveRestore, X } from 'lucide-react'

export default function ProjectArchiveModal({ onClose, onRestored }) {
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState(null)

  const fetchArchived = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('is_archived', true)
      .order('created_at', { ascending: false })
    setArchived(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchArchived() }, [])

  const handleRestore = async (project) => {
    if (!window.confirm(`Pulihkan project "${project.name}" ke daftar aktif?`)) return
    setRestoringId(project.id)
    await supabase.from('projects').update({ is_archived: false }).eq('id', project.id)
    setRestoringId(null)
    fetchArchived()
    onRestored()
  }

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 className="modal-title" style={{ margin: 0 }}>Project Archive</h3>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 20 }}>
            Project yang diarsipkan tidak akan muncul di Planner, To Do List, dan Link & Access. Klik "Start Again" untuk memulihkan project ke daftar aktif.
          </p>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Memuat...</p>
          ) : archived.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <h3>Tidak ada project yang diarsipkan</h3>
              <p>Project yang kamu selesaikan akan muncul di sini.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {archived.map(p => (
                <div key={p.id} className="archive-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="project-dot" style={{ width: 36, height: 36, borderRadius: 10 }}>
                      {p.logo_url
                        ? <img src={p.logo_url} alt="" />
                        : p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Diarsipkan
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRestore(p)}
                    disabled={restoringId === p.id}
                  >
                    <ArchiveRestore size={15} />
                    {restoringId === p.id ? 'Memulihkan...' : 'Start Again'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}
