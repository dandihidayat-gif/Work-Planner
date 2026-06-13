import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const PRESET_COLORS = ['#3366FF', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#0EA5E9', '#EC4899', '#14B8A6']

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
    if (error) {
      setError(error.message)
      return
    }
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
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Selamat datang di Content Planner 👋
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
              Sebelum mulai, yuk buat project pertama kamu. Project bisa berupa klien, brand, atau tim yang kontennya kamu kelola.
            </p>
            <img src="/images/onboarding-illustration.png" alt="" style={{ width: '100%', borderRadius: 16, marginBottom: 24 }} />
            <div className="modal-actions split">
              <button className="btn btn-ghost" onClick={handleSkip}>Lewati untuk sekarang</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Mulai</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Buat project pertama</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Beri nama dan pilih warna identitas untuk project ini.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <div className="field-group">
              <label className="field-label">Nama Project</label>
              <input
                className="field-input"
                placeholder="Contoh: Luna Creative"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Warna Identitas</label>
              <div className="color-swatches">
                {PRESET_COLORS.map((c) => (
                  <div
                    key={c}
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="modal-actions split">
              <button className="btn btn-ghost" onClick={handleSkip}>Lewati</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!name.trim() || loading}
              >
                {loading ? 'Menyimpan...' : 'Buat Project & Mulai'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
