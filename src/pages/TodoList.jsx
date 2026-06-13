import React, { useEffect, useState, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import AddTaskModal from '../components/AddTaskModal'
import TaskDetailModal from '../components/TaskDetailModal'
import { supabase } from '../lib/supabase'
import { Plus, ArrowUp, ArrowDown, MoreHorizontal, Eye, Trash2, PlayCircle, CheckCircle2 } from 'lucide-react'

export default function TodoList() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [sortProject, setSortProject] = useState('all')
  const [openMenu, setOpenMenu] = useState(null)
  const menuRef = useRef(null)

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at')
    setProjects(data || [])
  }, [])

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('sort_order', { ascending: true })
    setTasks(data || [])
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchTasks() }, [fetchTasks])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const projectById = (id) => projects.find((p) => p.id === id)

  const filteredTasks = sortProject === 'all'
    ? tasks
    : tasks.filter((t) => t.project_id === sortProject)

  const moveTask = async (task, direction) => {
    const sameProjectTasks = tasks
      .filter((t) => t.project_id === task.project_id)
      .sort((a, b) => a.sort_order - b.sort_order)

    const idx = sameProjectTasks.findIndex((t) => t.id === task.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sameProjectTasks.length) return

    const a = sameProjectTasks[idx]
    const b = sameProjectTasks[swapIdx]

    await supabase.from('tasks').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('tasks').update({ sort_order: a.sort_order }).eq('id', b.id)
    fetchTasks()
  }

  const updateStatus = async (task, status) => {
    await supabase.from('tasks').update({ status }).eq('id', task.id)
    setOpenMenu(null)
    fetchTasks()
  }

  const deleteTask = async (task) => {
    if (!window.confirm('Hapus task ini?')) return
    await supabase.from('tasks').delete().eq('id', task.id)
    setOpenMenu(null)
    fetchTasks()
  }

  return (
    <div className="app-shell">
      <Sidebar projects={projects} onProjectsChange={fetchProjects} />

      <div className="main">
        <div className="page-header">
          <h1 className="page-title">To Do List</h1>
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)} disabled={projects.length === 0}>
            <Plus size={17} /> Task
          </button>
        </div>

        <div className="todo-toolbar">
          <select className="field-select" style={{ maxWidth: 220 }} value={sortProject} onChange={(e) => setSortProject(e.target.value)}>
            <option value="all">Semua Project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <h3>Belum ada task</h3>
            <p>Klik tombol "+ Task" untuk menambahkan task baru.</p>
          </div>
        ) : (
          <table className="todo-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Project</th>
                <th>Task</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, i) => {
                const project = projectById(task.project_id)
                return (
                  <tr key={task.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span className="project-tag" style={{ background: `${project?.color}1A`, color: project?.color }}>
                        {project?.name}
                      </span>
                    </td>
                    <td>{task.title}</td>
                    <td>{task.no_deadline ? 'No Deadline' : task.deadline}</td>
                    <td>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="table-icon-btn" onClick={() => moveTask(task, 'up')} title="Naikkan">
                          <ArrowUp size={15} />
                        </button>
                        <button className="table-icon-btn" onClick={() => moveTask(task, 'down')} title="Turunkan">
                          <ArrowDown size={15} />
                        </button>
                        <div style={{ position: 'relative' }} ref={openMenu === task.id ? menuRef : null}>
                          <button className="table-icon-btn" onClick={() => setOpenMenu(openMenu === task.id ? null : task.id)}>
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenu === task.id && (
                            <div className="dropdown-menu">
                              <button className="dropdown-item" onClick={() => { setDetailTask(task); setOpenMenu(null) }}>
                                <Eye size={15} /> Detail Task
                              </button>

                              {task.status === 'pending' && (
                                <>
                                  <button className="dropdown-item" onClick={() => updateStatus(task, 'on_progress')}>
                                    <PlayCircle size={15} /> Start Progress
                                  </button>
                                  <button className="dropdown-item danger" onClick={() => deleteTask(task)}>
                                    <Trash2 size={15} /> Delete Task
                                  </button>
                                </>
                              )}

                              {task.status === 'on_progress' && (
                                <>
                                  <button className="dropdown-item" onClick={() => updateStatus(task, 'done')}>
                                    <CheckCircle2 size={15} /> Task Complete
                                  </button>
                                  <button className="dropdown-item danger" onClick={() => deleteTask(task)}>
                                    <Trash2 size={15} /> Delete Task
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAddTask && (
        <AddTaskModal
          projects={projects}
          onClose={() => setShowAddTask(false)}
          onSaved={() => { setShowAddTask(false); fetchTasks() }}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          project={projectById(detailTask.project_id)}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  )
}
