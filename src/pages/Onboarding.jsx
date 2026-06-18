import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Heart, ExternalLink } from 'lucide-react'

const PRESET_COLORS = ['#3366FF','#22C55E','#F59E0B','#EF4444','#A855F7','#0EA5E9','#EC4899','#14B8A6']

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: name.trim(),
      color,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/')
  }

  const handleSkip = () => navigate('/')

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`} />
          <div className={`step ${step >= 2 ? 'active' : ''}`} />
        </div>

        {step === 1 && (
          <>
            {/* FREE badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 700, fontSize: 12, padding: '4px 12px', borderRadius: 999, marginBottom: 16 }}>
              ✦ This app is 100% FREE
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Selamat datang di TALJER 👋
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
              Sebelum mulai, yuk buat project pertama kamu. Project bisa berupa klien, brand, atau tim yang kontennya kamu kelola.
            </p>

            {/* DONATE SECTION */}
            <div style={{ background: 'linear-gradient(135deg, #EAF0FF 0%, #F0EAFF 100%)', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Heart size={18} color="#EF4444" fill="#EF4444" />
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Bantu kami berkembang</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
                Yuk, bantu creator agar aplikasi ini semakin bermanfaat! Donasi kamu, sekecil apapun, sangat berarti untuk pengembangan TALJER ke depannya.
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <img src="/images/saweria-qr.png" alt="QR Saweria" style={{ width: 90, height: 90, borderRadius: 10, border: '2px solid #fff', flexShrink: 0 }} />
                <div>
                  <a href="https://saweria.co/taljer" target="_blank" rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ marginBottom: 8, display: 'inline-flex', gap: 6 }}>
                    <ExternalLink size={14} /> Donasi via Saweria
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Scan QR atau klik link di atas.<br />Terima kasih! 🙏
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions split">
              <button className="btn btn-ghost" onClick={handleSkip}>Lewati untuk sekarang</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Mulai</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Buat project pertama</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
              Beri nama dan pilih warna identitas untuk project ini.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <div className="field-group">
              <label className="field-label">Nama Project</label>
              <input className="field-input" placeholder="Contoh: Luna Creative"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label">Warna Identitas</label>
              <div className="color-swatches">
                {PRESET_COLORS.map(c => (
                  <div key={c} className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>

            <div className="modal-actions split">
              <button className="btn btn-ghost" onClick={handleSkip}>Lewati</button>
              <button className="btn btn-primary" onClick={handleCreate}
                disabled={!name.trim() || loading}>
                {loading ? 'Menyimpan...' : 'Buat Project & Mulai'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
