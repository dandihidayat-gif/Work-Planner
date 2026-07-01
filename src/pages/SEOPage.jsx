import React, { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ModalPortal from '../components/ModalPortal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, ExternalLink, Save, Trash2 } from 'lucide-react'

function AddPageModal({ projects, onClose, onSaved }) {
  const { user } = useAuth()
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectId || !url.trim()) { setError('Pilih project dan masukkan URL.'); return }
    setLoading(true)
    const { error } = await supabase.from('seo_pages').insert({
      user_id: user.id,
      project_id: projectId,
      url: url.trim(),
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">Add Page</h3>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Project</label>
              <select className="field-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">URL Halaman</label>
              <input className="field-input" placeholder="https://example.com/halaman"
                value={url} onChange={e => setUrl(e.target.value)} required />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Add Page'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}

function SEOEditor({ page, onSaved, onDeleted }) {
  const [title, setTitle] = useState(page.title || '')
  const [keyphrase, setKeyphrase] = useState(page.focus_keyphrase || '')
  const [metaDesc, setMetaDesc] = useState(page.meta_description || '')
  const [slug, setSlug] = useState(page.slug || '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    setTitle(page.title || '')
    setKeyphrase(page.focus_keyphrase || '')
    setMetaDesc(page.meta_description || '')
    setSlug(page.slug || '')
    setMsg(null)
  }, [page.id])

  const handleSave = async () => {
    setLoading(true)
    setMsg(null)
    const now = new Date().toISOString()
    const { error } = await supabase.from('seo_pages').update({
      title: title.trim() || null,
      focus_keyphrase: keyphrase.trim() || null,
      meta_description: metaDesc.trim() || null,
      slug: slug.trim() || null,
      last_updated: now,
    }).eq('id', page.id)
    setLoading(false)
    if (error) setMsg({ type: 'error', text: error.message })
    else { setMsg({ type: 'success', text: 'Tersimpan.' }); onSaved() }
  }

  const handleDelete = async () => {
    if (!window.confirm('Hapus halaman ini?')) return
    await supabase.from('seo_pages').delete().eq('id', page.id)
    onDeleted()
  }

  const metaDescLength = metaDesc.length
  const metaDescColor = metaDescLength === 0 ? 'var(--text-muted)' : metaDescLength < 120 ? 'var(--warning)' : metaDescLength <= 160 ? 'var(--success)' : 'var(--danger)'

  return (
    <div className="seo-editor">
      {/* Header */}
      <div className="seo-editor-header">
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          {page.url}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <a href={page.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} /> Go to Page
          </a>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {msg && <div className={msg.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginBottom: 14 }}>{msg.text}</div>}

        <div className="field-group">
          <label className="field-label">Title</label>
          <input className="field-input" placeholder="Judul halaman untuk SEO"
            value={title} onChange={e => setTitle(e.target.value)} />
          <div style={{ fontSize: 12, color: title.length > 60 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 4 }}>
            {title.length}/60 karakter ideal
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Focus Keyphrase</label>
          <input className="field-input" placeholder="Kata kunci utama, misal: jasa desain grafis"
            value={keyphrase} onChange={e => setKeyphrase(e.target.value)} />
        </div>

        <div className="field-group">
          <label className="field-label">Meta Description</label>
          <textarea className="field-input" placeholder="Deskripsi singkat halaman (120-160 karakter ideal)"
            value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
            rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ fontSize: 12, color: metaDescColor, marginTop: 4 }}>
            {metaDescLength}/160 — {metaDescLength < 120 ? 'terlalu pendek' : metaDescLength <= 160 ? 'ideal' : 'terlalu panjang'}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Slug / URL Path</label>
          <input className="field-input" placeholder="/nama-halaman"
            value={slug} onChange={e => setSlug(e.target.value)} />
        </div>

        {/* SERP Preview */}
        {(title || metaDesc) && (
          <div className="seo-serp-preview">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preview Google
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page.url}{slug}</div>
            <div style={{ fontSize: 17, color: '#1a0dab', fontWeight: 400, marginTop: 2, lineHeight: 1.3 }}>
              {title || 'Judul halaman'}
            </div>
            <div style={{ fontSize: 13, color: '#4d5156', marginTop: 4, lineHeight: 1.5 }}>
              {metaDesc || 'Meta description akan muncul di sini...'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <Save size={16} /> {loading ? 'Menyimpan...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SEOPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [showAddPage, setShowAddPage] = useState(false)

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').eq('is_archived', false).order('created_at')
    setProjects(data || [])
  }, [])

  const fetchPages = useCallback(async () => {
    const { data } = await supabase.from('seo_pages').select('*').order('created_at')
    setPages(data || [])
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchPages() }, [fetchPages])

  const handleSaved = () => {
    fetchPages()
    // refresh selected page data
    if (selectedPage) {
      supabase.from('seo_pages').select('*').eq('id', selectedPage.id).single().then(({ data }) => {
        if (data) setSelectedPage(data)
      })
    }
  }

  const handleDeleted = () => {
    setSelectedPage(null)
    fetchPages()
  }

  const projectById = (id) => projects.find(p => p.id === id)

  const pagesByProject = projects.map(p => ({
    project: p,
    items: pages.filter(pg => pg.project_id === p.id)
  })).filter(g => g.items.length > 0)

  return (
    <div className="app-shell">
      <Sidebar projects={projects} onProjectsChange={fetchProjects} />
      <div className="main">
        <TopNav onProjectsChange={fetchProjects} />

        <div className="page-header">
          <h1 className="page-title">SEO Page</h1>
          <button className="btn btn-primary" onClick={() => setShowAddPage(true)} disabled={projects.length === 0}>
            <Plus size={17} /> New Page
          </button>
        </div>

        <div className="seo-layout">
          {/* KOLOM 1: LIST */}
          <div className="seo-list-col">
            {pagesByProject.length === 0 ? (
              <div className="empty-state">
                <h3>Belum ada halaman</h3>
                <p>Klik "New Page" untuk mulai pantau SEO halaman project kamu.</p>
              </div>
            ) : (
              pagesByProject.map(({ project, items }) => (
                <div key={project.id} style={{ marginBottom: 24 }}>
                  <div className="link-group-header" style={{ marginBottom: 10 }}>
                    <div className="project-dot" style={{ width: 24, height: 24 }}>
                      {project.logo_url ? <img src={project.logo_url} alt="" /> : project.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 800 }}>{project.name}</span>
                  </div>
                  <table className="todo-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>#</th>
                        <th>Page URL</th>
                        <th>Title</th>
                        <th>Last Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((pg, i) => (
                        <tr key={pg.id}
                          className={selectedPage?.id === pg.id ? 'seo-row-active' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedPage(pg)}>
                          <td>{i + 1}</td>
                          <td>
                            <span style={{ fontSize: 12.5, wordBreak: 'break-all', color: 'var(--primary)' }}>
                              {pg.url}
                            </span>
                          </td>
                          <td style={{ color: pg.title ? 'var(--text)' : 'var(--text-muted)' }}>
                            {pg.title || '-'}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {pg.last_updated ? new Date(pg.last_updated).toLocaleDateString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>

          {/* KOLOM 2: EDITOR */}
          <div className="seo-editor-col">
            {selectedPage ? (
              <SEOEditor
                key={selectedPage.id}
                page={selectedPage}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                <div>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Pilih halaman</div>
                  <div style={{ fontSize: 13 }}>Klik salah satu halaman di sebelah kiri untuk mulai mengedit SEO-nya.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddPage && (
        <AddPageModal
          projects={projects}
          onClose={() => setShowAddPage(false)}
          onSaved={() => { setShowAddPage(false); fetchPages() }}
        />
      )}
    </div>
  )
}
