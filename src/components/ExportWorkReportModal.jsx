import React, { useState } from 'react'
import ModalPortal from './ModalPortal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../lib/supabase'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const WEEKDAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const PRIMARY = [51, 102, 255]
const LIGHT_BLUE = [234, 240, 255]
const SUCCESS = [34, 197, 94]
const MUTED = [148, 163, 184]
const TEXT = [30, 36, 51]
const BORDER = [230, 233, 240]

function loadImg(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.width; c.height = img.height
        c.getContext('2d').drawImage(img, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function getDaysInMonth(year, month) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // start from Monday
  let startDow = firstDay.getDay() // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1 // convert to Mon=0

  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  // pad to complete weeks
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function ExportWorkReportModal({ projects, onClose }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedProjects, setSelectedProjects] = useState(projects.map(p => p.id))
  const [loading, setLoading] = useState(false)

  const toggleProject = (id) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedProjects.length === projects.length) setSelectedProjects([])
    else setSelectedProjects(projects.map(p => p.id))
  }

  const years = []
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y)

  const handleExport = async () => {
    if (selectedProjects.length === 0) return alert('Pilih minimal 1 project.')
    setLoading(true)

    const monthStr = String(month + 1).padStart(2, '0')
    const periodPrefix = `${year}-${monthStr}`

    // fetch posts & tasks for period
    const firstDay = `${year}-${monthStr}-01`
    const lastDayNum = new Date(year, month + 1, 0).getDate()
    const lastDay = `${year}-${monthStr}-${String(lastDayNum).padStart(2, '0')}`

    const { data: posts, error: postsError } = await supabase
      .from('post_schedules')
      .select('*')
      .in('project_id', selectedProjects)
      .gte('post_date', firstDay)
      .lte('post_date', lastDay)
      .order('post_date')

    if (postsError) console.error('posts error:', postsError)
    console.log('posts fetched:', posts?.length, 'period:', firstDay, '-', lastDay, 'projects:', selectedProjects)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', selectedProjects)
      .or(`deadline.gte.${periodPrefix}-01,completed_at.gte.${periodPrefix}-01`)

    const filteredTasks = (tasks || []).filter(t => {
      const dl = t.deadline && t.deadline.startsWith(periodPrefix)
      const ca = t.completed_at && t.completed_at.startsWith(periodPrefix)
      return dl || ca
    })

    const selectedProjectsData = projects.filter(p => selectedProjects.includes(p.id))

    // Preload logos
    const logoMap = {}
    for (const p of selectedProjectsData) {
      logoMap[p.id] = await loadImg(p.logo_url)
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()   // 841.89
    const H = doc.internal.pageSize.getHeight()  // 595.28
    const marginL = 36, marginR = 36
    const contentW = W - marginL - marginR

    // ============================================================
    // PAGE 1: CALENDAR + ALL POSTS TABLE
    // ============================================================
    let y = 36

    // Title header
    doc.setFillColor(...PRIMARY)
    doc.rect(0, 0, W, 48, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Work Report', marginL, 30)
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    const periodLabel = `${MONTHS[month]} ${year}`
    doc.text(periodLabel, W - marginR - doc.getTextWidth(periodLabel), 30)
    y = 66

    // --- CALENDAR ---
    const calCellW = contentW / 7
    const calCellH = 54
    const calTop = y

    // Calendar header row
    WEEKDAYS_SHORT.forEach((wd, i) => {
      doc.setFillColor(...LIGHT_BLUE)
      doc.rect(marginL + i * calCellW, calTop, calCellW, 16, 'F')
      doc.setTextColor(...PRIMARY)
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      doc.text(wd, marginL + i * calCellW + calCellW / 2, calTop + 11, { align: 'center' })
    })
    y = calTop + 16

    // Calendar cells
    const days = getDaysInMonth(year, month)
    const today = new Date()
    const isToday = (d) => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate()
    const postsByDay = {}
    ;(posts || []).forEach(p => {
      const d = parseInt(p.post_date.split('-')[2])
      if (!postsByDay[d]) postsByDay[d] = []
      postsByDay[d].push(p)
    })

    for (let row = 0; row < days.length / 7; row++) {
      for (let col = 0; col < 7; col++) {
        const d = days[row * 7 + col]
        const cx = marginL + col * calCellW
        const cy = y + row * calCellH

        // cell bg
        if (isToday(d)) {
          doc.setFillColor(...LIGHT_BLUE)
        } else {
          doc.setFillColor(255, 255, 255)
        }
        doc.rect(cx, cy, calCellW, calCellH, 'F')
        doc.setDrawColor(...BORDER)
        doc.rect(cx, cy, calCellW, calCellH, 'S')

        if (d) {
          // date number
          doc.setTextColor(...(isToday(d) ? PRIMARY : MUTED))
          doc.setFontSize(8)
          doc.setFont(undefined, 'bold')
          doc.text(String(d), cx + 5, cy + 10)

          // post chips (max 2 visible)
          const dayPosts = postsByDay[d] || []
          dayPosts.slice(0, 2).forEach((post, pi) => {
            const proj = selectedProjectsData.find(p => p.id === post.project_id)
            const chipY = cy + 14 + pi * 13
            // parse hex color
            let r = 51, g = 102, b = 255
            if (proj?.color) {
              const hex = proj.color.replace('#', '')
              r = parseInt(hex.substring(0, 2), 16)
              g = parseInt(hex.substring(2, 4), 16)
              b = parseInt(hex.substring(4, 6), 16)
            }
            doc.setFillColor(r, g, b, 0.15)
            doc.setFillColor(r + Math.round((255 - r) * 0.85), g + Math.round((255 - g) * 0.85), b + Math.round((255 - b) * 0.85))
            doc.roundedRect(cx + 3, chipY, calCellW - 6, 11, 2, 2, 'F')
            doc.setTextColor(r, g, b)
            doc.setFontSize(6.5)
            doc.setFont(undefined, 'bold')
            const chipText = (proj?.name || '') + (post.status === 'posted' ? ' ✓' : '')
            doc.text(chipText, cx + 5, chipY + 7.5, { maxWidth: calCellW - 10 })
          })
          if (dayPosts.length > 2) {
            doc.setTextColor(...MUTED)
            doc.setFontSize(6)
            doc.text(`+${dayPosts.length - 2} more`, cx + 5, cy + 14 + 2 * 13 + 6)
          }
        }
      }
      // check if we're going to overflow
    }

    y = y + Math.ceil(days.length / 7) * calCellH + 20

    // --- ALL POSTS TABLE ---
    doc.setTextColor(...TEXT)
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Jadwal Posting', marginL, y)
    y += 10

    if ((posts || []).length === 0) {
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(...MUTED)
      doc.text('Tidak ada jadwal posting pada periode ini.', marginL, y + 14)
    } else {
      const postRows = (posts || []).map(p => {
        const proj = selectedProjectsData.find(pr => pr.id === p.project_id)
        return [
          proj?.name || '-',
          p.title,
          p.content_type,
          p.post_date,
          (p.platforms || []).join(', ') || '-',
          p.status === 'posted' ? 'Posted ✓' : 'Unposted',
        ]
      })

      autoTable(doc, {
        startY: y,
        head: [['Project', 'Judul Konten', 'Tipe', 'Tanggal', 'Platform', 'Status']],
        body: postRows,
        styles: { fontSize: 8, cellPadding: 5, textColor: TEXT },
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 180 },
          2: { cellWidth: 70 },
          3: { cellWidth: 80 },
          4: { cellWidth: 120 },
          5: { cellWidth: 80 },
        },
        margin: { left: marginL, right: marginR },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Posted ✓') {
              data.cell.styles.textColor = SUCCESS
            }
          }
        }
      })
    }

    // ============================================================
    // PAGE 2+: TASKS PER PROJECT
    // ============================================================
    doc.addPage()

    // Page header
    doc.setFillColor(...PRIMARY)
    doc.rect(0, 0, W, 48, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Work Report — Tasks', marginL, 30)
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text(periodLabel, W - marginR - doc.getTextWidth(periodLabel), 30)

    let taskY = 66

    for (const proj of selectedProjectsData) {
      const projTasks = filteredTasks.filter(t => t.project_id === proj.id)

      // check if we need a new page for this project block
      if (taskY > H - 120) {
        doc.addPage()
        taskY = 36
      }

      // project header row
      doc.setFillColor(...LIGHT_BLUE)
      doc.rect(marginL, taskY, contentW, 28, 'F')

      const logo = logoMap[proj.id]
      if (logo) {
        try {
          doc.addImage(logo, 'PNG', marginL + 6, taskY + 4, 20, 20)
        } catch {}
      }
      const logoOffset = logo ? 32 : 8

      doc.setTextColor(...PRIMARY)
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text(proj.name, marginL + logoOffset, taskY + 18)

      // hex color accent bar
      const hex = (proj.color || '#3366FF').replace('#', '')
      const cr = parseInt(hex.substring(0, 2), 16)
      const cg = parseInt(hex.substring(2, 4), 16)
      const cb = parseInt(hex.substring(4, 6), 16)
      doc.setFillColor(cr, cg, cb)
      doc.rect(marginL, taskY, 4, 28, 'F')

      taskY += 28

      if (projTasks.length === 0) {
        doc.setFontSize(8.5)
        doc.setFont(undefined, 'italic')
        doc.setTextColor(...MUTED)
        doc.text('Tidak ada task untuk periode ini.', marginL + 8, taskY + 14)
        taskY += 28
      } else {
        const taskRows = projTasks.map(t => [
          t.title,
          t.no_deadline ? 'No Deadline' : (t.deadline || '-'),
          t.completed_at || '-',
          t.status === 'done' ? 'Done ✓' : t.status === 'on_progress' ? 'On Progress' : 'Pending',
          t.final_link || '-',
          t.completion_note || '-',
        ])

        autoTable(doc, {
          startY: taskY,
          head: [['Nama Task', 'Deadline', 'Completion Date', 'Status', 'Final URL', 'Description']],
          body: taskRows,
          styles: { fontSize: 8, cellPadding: 5, textColor: TEXT },
          headStyles: { fillColor: [245, 247, 252], textColor: PRIMARY, fontStyle: 'bold', lineColor: BORDER, lineWidth: 0.5 },
          bodyStyles: { lineColor: BORDER, lineWidth: 0.3 },
          columnStyles: {
            0: { cellWidth: 150 },
            1: { cellWidth: 75 },
            2: { cellWidth: 90 },
            3: { cellWidth: 75 },
            4: { cellWidth: 180 },
            5: { cellWidth: 'auto' },
          },
          margin: { left: marginL, right: marginR },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              if (data.cell.raw === 'Done ✓') data.cell.styles.textColor = SUCCESS
              if (data.cell.raw === 'On Progress') data.cell.styles.textColor = [245, 158, 11]
            }
          }
        })

        taskY = doc.lastAutoTable.finalY + 20
      }
    }

    // footer: page number (center) + TALJER branding (left/right)
    const totalPages = doc.internal.getNumberOfPages()
    const footerY = H - 16
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      // thin separator line
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.5)
      doc.line(marginL, footerY - 10, W - marginR, footerY - 10)

      doc.setFontSize(7.5)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(...MUTED)

      // left: generated by TALJER
      doc.text('Generated by TALJER — Task List Manager', marginL, footerY)

      // center: page number
      doc.text(`Halaman ${i} / ${totalPages}`, W / 2, footerY, { align: 'center' })

      // right: app link
      doc.setTextColor(...PRIMARY)
      const urlText = 'work-planner-chi.vercel.app'
      doc.text(urlText, W - marginR - doc.getTextWidth(urlText), footerY)
    }

    doc.save(`work-report-${MONTHS[month]}-${year}.pdf`)
    setLoading(false)
    onClose()
  }

  const years2 = []
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years2.push(y)

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Export Work Report</h3>

        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          PDF akan berisi: kalender bulanan + daftar semua posting (Page 1), diikuti rekap task per project (Page 2+).
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Bulan</label>
            <select className="field-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Tahun</label>
            <select className="field-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years2.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Project</label>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedProjects.length === projects.length}
                onChange={toggleAll}
              />
              Semua Project
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', padding: '8px 0' }}>
            {projects.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(p.id)}
                  onChange={() => toggleProject(p.id)}
                />
                <div className="project-dot" style={{ width: 22, height: 22, flexShrink: 0 }}>
                  {p.logo_url ? <img src={p.logo_url} alt="" /> : p.name.slice(0, 2).toUpperCase()}
                </div>
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={loading || selectedProjects.length === 0}
          >
            {loading ? 'Membuat PDF...' : 'Export Report'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
