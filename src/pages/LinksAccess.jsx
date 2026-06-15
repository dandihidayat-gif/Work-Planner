import React, { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import AddProjectLinkModal from '../components/AddProjectLinkModal'
import AddLinkTypeModal from '../components/AddLinkTypeModal'
import { supabase } from '../lib/supabase'
import { Plus, ExternalLink, Trash2 } from 'lucide-react'

export default function LinksAccess() {
  const [projects, setProjects] = useState([])
  const [linkTypes, setLinkTypes] = useState([])
  const [projectLinks, setProjectLinks] = useState([])
  const [tab, setTab] = useState('links') // 'links' | 'types'
  const [showAddLink, setShowAddLink] = useState(false)
  const [showAddType, setShowAddType] = useState(false)

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at')
    setProjects(data || [])
  }, [])

  const fetchLinkTypes = useCallback(async () => {
    const { data } = await supabase.from('link_types').select('*').order('created_at')
    setLinkTypes(data || [])
  }, [])

  const fetchProjectLinks = useCallback(async () => {
    const { data } = await supabase.from('project_links').select('*').order('created_at')
    setProjectLinks(data || [])
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchLinkTypes() }, [fetchLinkTypes])
  useEffect(() => { fetchProjectLinks() }, [fetchProjectLinks])

  const linkTypeById = (id) => linkTypes.find((lt) => lt.id === id)

  const deleteLinkType = async (id) => {
    if (!window.confirm('Hapus link type ini? Link yang menggunakan tipe ini akan kehilangan referensi tipenya.')) return
    await supabase.from('link_types').delete().eq('id', id)
    fetchLinkTypes()
    fetchProjectLinks()
  }

  const deleteProjectLink = async (id) => {
    if (!window.confirm('Hapus link ini?')) return
    await supabase.from('project_links').delete().eq('id', id)
    fetchProjectLinks()
  }

  const linksByProject = projects
    .map((p) => ({
      project: p,
      links: projectLinks.filter((l) => l.project_id === p.id),
    }))
    .filter((g) => g.links.length > 0)

  return (
    <div className="app-shell">
      <Sidebar projects={projects} onProjectsChange={fetchProjects} />

      <div className="main">
        <div className="page-header">
          <h1 className="page-title">Link &amp; Access</h1>
          {tab === 'links' ? (
            <button className="btn btn-primary" onClick={() => setShowAddLink(true)} disabled={projects.length === 0 || linkTypes.length === 0}>
              <Plus size={17} /> Add Link
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAddType(true)}>
              <Plus size={17} /> New Link Type
            </button>
          )}
        </div>

        <div className="tabs">
          <button className={`tab-item ${tab === 'links' ? 'active' : ''}`} onClick={() => setTab('links')}>Link</button>
          <button className={`tab-item ${tab === 'types' ? 'active' : ''}`} onClick={() => setTab('types')}>Link Type</button>
        </div>

        {tab === 'links' && (
          <>
            {linkTypes.length === 0 && (
              <div className="empty-state">
                <h3>Belum ada Link Type</h3>
                <p>Buat Link Type dulu di tab "Link Type" (contoh: Instagram, Google Drive, Figma).</p>
              </div>
            )}

            {linkTypes.length > 0 && linksByProject.length === 0 && (
              <div className="empty-state">
                <h3>Belum ada link</h3>
                <p>Klik "Add Link" untuk menambahkan link & access pertama.</p>
              </div>
            )}

            {linksByProject.map(({ project, links }) => (
              <div key={project.id} className="link-group">
                <div className="link-group-header">
                  <div className="project-dot" style={{ background: project.color, width: 26, height: 26 }}>
                    {project.logo_url
                      ? <img src={project.logo_url} alt="" />
                      : project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{project.name}</span>
                </div>
                <table className="todo-table" style={{ marginBottom: 24 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Jenis Link</th>
                      <th>URL</th>
                      <th>Catatan</th>
                      <th style={{ width: 90 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link, i) => {
                      const lt = linkTypeById(link.link_type_id)
                      return (
                        <tr key={link.id}>
                          <td>{i + 1}</td>
                          <td>
                            <span className="link-type-tag">
                              {lt?.icon_url && <img src={lt.icon_url} alt="" />}
                              {lt?.name || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <a href={link.url} target="_blank" rel="noreferrer" className="link-url">
                              {link.url} <ExternalLink size={13} />
                            </a>
                          </td>
                          <td>{link.notes || '-'}</td>
                          <td>
                            <button className="table-icon-btn" onClick={() => deleteProjectLink(link.id)} title="Delete">
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}

        {tab === 'types' && (
          <>
            {linkTypes.length === 0 ? (
              <div className="empty-state">
                <h3>Belum ada Link Type</h3>
                <p>Klik "+ New Link Type" untuk menambahkan jenis link, misal Instagram, Google Drive, Figma.</p>
              </div>
            ) : (
              <table className="todo-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Icon</th>
                    <th>Nama Link Type</th>
                    <th style={{ width: 90 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {linkTypes.map((lt) => (
                    <tr key={lt.id}>
                      <td>
                        <div className="link-type-icon-cell">
                          {lt.icon_url
                            ? <img src={lt.icon_url} alt="" />
                            : <div className="link-type-icon-fallback">{lt.name.slice(0, 2).toUpperCase()}</div>}
                        </div>
                      </td>
                      <td>{lt.name}</td>
                      <td>
                        <button className="table-icon-btn" onClick={() => deleteLinkType(lt.id)} title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {showAddLink && (
        <AddProjectLinkModal
          projects={projects}
          linkTypes={linkTypes}
          onClose={() => setShowAddLink(false)}
          onSaved={() => { setShowAddLink(false); fetchProjectLinks() }}
        />
      )}

      {showAddType && (
        <AddLinkTypeModal
          onClose={() => setShowAddType(false)}
          onSaved={() => { setShowAddType(false); fetchLinkTypes() }}
        />
      )}
    </div>
  )
}
