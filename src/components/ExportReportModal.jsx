import React, { useState } from 'react'
import ModalPortal from './ModalPortal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export default function ExportReportModal({ projects, tasks, onClose }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)

    const monthStr = String(month + 1).padStart(2, '0')
    const periodPrefix = `${year}-${monthStr}`

    // group tasks per project where deadline OR completed_at falls in selected month
    const relevantTasks = tasks.filter((t) => {
      const deadlineMatch = t.deadline && t.deadline.startsWith(periodPrefix)
      const completedMatch = t.completed_at && t.completed_at.startsWith(periodPrefix)
      return deadlineMatch || completedMatch
    })

    const groups = projects
      .map((p) => ({
        project: p,
        items: relevantTasks.filter((t) => t.project_id === p.id),
      }))
      .filter((g) => g.items.length > 0)

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 40

    if (groups.length === 0) {
      doc.setFontSize(14)
      doc.text(`Tidak ada task untuk periode ${MONTHS[month]} ${year}.`, 40, y)
    }

    for (let g = 0; g < groups.length; g++) {
      const { project, items } = groups[g]

      if (g > 0) {
        doc.addPage()
        y = 40
      }

      // Header: logo + project name (left), period (right)
      const logoData = await loadImageAsDataURL(project.logo_url)
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', 40, y - 20, 28, 28)
        } catch {}
      }

      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text(project.name, logoData ? 76 : 40, y)

      doc.setFontSize(11)
      doc.setFont(undefined, 'normal')
      const periodText = `Periode ${MONTHS[month]} ${year}`
      doc.text(periodText, pageWidth - 40 - doc.getTextWidth(periodText), y)

      y += 24

      const rows = items.map((t) => [
        t.title,
        t.no_deadline ? 'No Deadline' : (t.deadline || '-'),
        t.completed_at || '-',
        t.final_link || '-',
        t.completion_note || '-',
      ])

      autoTable(doc, {
        startY: y,
        head: [['Nama Task', 'Deadline', 'Completion Date', 'Final URL', 'Description']],
        body: rows,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [51, 102, 255], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 160 },
          1: { cellWidth: 80 },
          2: { cellWidth: 90 },
          3: { cellWidth: 180 },
          4: { cellWidth: 'auto' },
        },
        margin: { left: 40, right: 40 },
      })
    }

    doc.save(`task-report-${MONTHS[month]}-${year}.pdf`)
    setLoading(false)
    onClose()
  }

  const years = []
  for (let yr = now.getFullYear() - 2; yr <= now.getFullYear() + 1; yr++) years.push(yr)

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Export Report</h3>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          Pilih periode laporan. Task dengan deadline atau completion date pada bulan tersebut akan dimasukkan ke PDF, dikelompokkan per project.
        </p>

        <div className="field-group">
          <label className="field-label">Bulan</label>
          <select className="field-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">Tahun</label>
          <select className="field-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={loading}>
            {loading ? 'Membuat PDF...' : 'Export Report'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
