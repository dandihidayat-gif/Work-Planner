import React from 'react'
import ModalPortal from './ModalPortal'
import { Heart, ExternalLink, X } from 'lucide-react'

export default function DonateModal({ onClose }) {
  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <button className="icon-btn" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>
            <X size={18} />
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 700, fontSize: 12, padding: '4px 14px', borderRadius: 999, marginBottom: 16 }}>
            ✦ 100% FREE
          </div>

          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            Selamat datang di TALJER!
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Aplikasi ini <strong>100% gratis</strong> untuk semua orang. Yuk, bantu creator agar TALJER bisa terus berkembang dan semakin bermanfaat buat kamu dan tim kreatifmu.
          </p>

          <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '16px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
            <img src="/images/saweria-qr.png" alt="QR Saweria"
              style={{ width: 80, height: 80, borderRadius: 10, border: '2px solid var(--border)', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Donasi via Saweria</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                Scan QR atau klik tombol di bawah.<br />Sekecil apapun, sangat berarti! 🙏
              </div>
              <a href="https://saweria.co/dandihidayat" target="_blank" rel="noreferrer"
                className="btn btn-primary btn-sm" style={{ display: 'inline-flex', gap: 6 }}>
                <Heart size={14} fill="currentColor" /> Donasi Sekarang
              </a>
            </div>
          </div>

          <button className="btn btn-secondary btn-block" onClick={onClose}>
            Lanjut ke App
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}
