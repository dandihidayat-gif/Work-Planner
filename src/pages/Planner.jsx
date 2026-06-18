import React, { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AddPostScheduleModal from '../components/AddPostScheduleModal'
import PostDetailModal from '../components/PostDetailModal'
import TopNav from '../components/TopNav'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, format, isSameMonth, isToday, addMonths, subMonths
} from 'date-fns'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN']

export default function Planner() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [projects, setProjects] = useState([])
  const [posts, setPosts] = useState([])
  const [showAddPost, setShowAddPost] = useState(false)
  const [addPostDate, setAddPostDate] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').eq('is_archived', false).order('created_at')
    setProjects(data || [])
  }, [])

  const fetchPosts = useCallback(async () => {
    const start = format(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const end = format(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('post_schedules')
      .select('*')
      .gte('post_date', start)
      .lte('post_date', end)
    setPosts(data || [])
  }, [currentMonth])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchPosts() }, [fetchPosts])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = []
  let day = gridStart
  while (day <= gridEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const projectById = (id) => projects.find((p) => p.id === id)

  const postsForDay = (d) => {
    const key = format(d, 'yyyy-MM-dd')
    return posts.filter((p) => p.post_date === key)
  }

  const openAddPost = (d) => {
    setAddPostDate(format(d, 'yyyy-MM-dd'))
    setShowAddPost(true)
  }

  return (
    <div className="app-shell">
      <Sidebar projects={projects} onProjectsChange={fetchProjects} />

      <div className="main">
        <TopNav onProjectsChange={fetchProjects} />
        <div className="page-header">
          <div className="page-title-group">
            <button className="icon-btn" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
              <ChevronLeft size={18} />
            </button>
            <h1 className="page-title">{format(currentMonth, 'MMMM yyyy')}</h1>
            <button className="icon-btn" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => { setAddPostDate(format(new Date(), 'yyyy-MM-dd')); setShowAddPost(true) }}
            disabled={projects.length === 0}
          >
            <Plus size={17} /> Add New Post Schedule
          </button>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <div className="calendar-head" key={w}>{w}</div>
          ))}

          {days.map((d, i) => {
            const dayPosts = postsForDay(d)
            const inMonth = isSameMonth(d, currentMonth)
            return (
              <div
                key={i}
                className={`calendar-cell ${!inMonth ? 'empty' : ''} ${isToday(d) ? 'today' : ''}`}
              >
                <div className="calendar-date">{format(d, 'd')}</div>
                <button className="cell-add" onClick={() => openAddPost(d)}>
                  <Plus size={14} />
                </button>

                {dayPosts.map((post) => {
                  const project = projectById(post.project_id)
                  const color = project?.color || '#3366FF'
                  return (
                    <div
                      key={post.id}
                      className="post-chip"
                      style={{ background: `${color}22`, color }}
                      onClick={() => setSelectedPost(post)}
                    >
                      <span>{project?.name}</span>
                      <span className={`chip-check ${post.status === 'unposted' ? 'unposted' : ''}`}>
                        {post.status === 'posted' && <Check size={10} strokeWidth={3} />}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {projects.length === 0 && (
          <div className="empty-state">
            <h3>Belum ada project</h3>
            <p>Tambahkan project terlebih dahulu di sidebar untuk mulai menjadwalkan postingan.</p>
          </div>
        )}
      </div>

      {showAddPost && (
        <AddPostScheduleModal
          projects={projects}
          defaultDate={addPostDate}
          onClose={() => setShowAddPost(false)}
          onSaved={() => { setShowAddPost(false); fetchPosts() }}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          project={projectById(selectedPost.project_id)}
          onClose={() => setSelectedPost(null)}
          onSaved={() => { setSelectedPost(null); fetchPosts() }}
          onDeleted={() => { setSelectedPost(null); fetchPosts() }}
        />
      )}
    </div>
  )
}
