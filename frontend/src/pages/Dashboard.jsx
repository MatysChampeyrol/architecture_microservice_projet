import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const API = import.meta.env.VITE_API_URL

function Dashboard({ user }) {
  const [models, setModels] = useState([])
  const [metricsData, setMetricsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'
  const token = localStorage.getItem('access_token')

  const fetchMetrics = useCallback(async () => {
    try {
      // Récupérer le résumé des modèles
      const [summaryRes, metricsRes] = await Promise.all([
        fetch(`${API}/training/metrics/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/training/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!summaryRes.ok || !metricsRes.ok) {
        throw new Error('Erreur lors du chargement des métriques')
      }

      const summaryData = await summaryRes.json()
      const fullData = await metricsRes.json()

      setModels(summaryData)
      setMetricsData(fullData)
      setError('')
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  // Préparer les données pour les graphiques accuracy/loss par epoch
  function buildChartData(metric) {
    if (metricsData.length === 0) return []
    const maxEpochs = Math.max(...metricsData.map(m => m.metrics.length), 0)
    const data = []
    for (let i = 0; i < maxEpochs; i++) {
      const point = { epoch: i + 1 }
      metricsData.forEach(m => {
        const label = `${m.library} / ${m.dataset}`
        if (m.metrics[i]) {
          point[label] = m.metrics[i][metric]
        }
      })
      data.push(point)
    }
    return data
  }

  // Préparer les données CPU/RAM pour les admins
  function buildSystemChartData(metric) {
    if (metricsData.length === 0) return []
    const maxEpochs = Math.max(...metricsData.map(m => m.metrics.length), 0)
    const data = []
    for (let i = 0; i < maxEpochs; i++) {
      const point = { epoch: i + 1 }
      metricsData.forEach(m => {
        const label = `${m.library} / ${m.dataset}`
        if (m.metrics[i]) {
          point[label] = m.metrics[i][metric]
        }
      })
      data.push(point)
    }
    return data
  }

  const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#a855f7']

  function getModelLines() {
    return metricsData.map((m, i) => `${m.library} / ${m.dataset}`)
  }

  if (loading) {
    return (
      <div>
        <div className="spinner" />
        <p className="loading-text">Chargement des métriques…</p>
      </div>
    )
  }

  const accuracyData = buildChartData('accuracy')
  const lossData = buildChartData('loss')
  const cpuData = buildSystemChartData('cpu')
  const ramData = buildSystemChartData('ram')
  const lineKeys = getModelLines()
  const hasData = metricsData.length > 0 && metricsData.some(m => m.metrics.length > 0)

  return (
    <div>
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Bienvenue, {user?.first_name || 'utilisateur'} — suivi en temps réel des entraînements</p>
      </div>

      {error && <p className="msg-error" style={{ marginBottom: '1rem' }}>{error}</p>}

      {/* Tableau des modèles */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <h3>Modèles entraînés</h3>
        {models.length === 0 ? (
          <div className="empty-state">
            <p>Aucun modèle en cours</p>
            <span>Les métriques apparaîtront ici quand un entraînement sera lancé via Docker</span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Modèle</th>
                <th>Epochs</th>
                <th>Accuracy</th>
                <th>Loss</th>
                {isAdmin && <th>CPU %</th>}
                {isAdmin && <th>RAM %</th>}
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td>{m.epochs_completed}</td>
                  <td>{(m.accuracy * 100).toFixed(1)}%</td>
                  <td>{m.loss.toFixed(4)}</td>
                  {isAdmin && <td>{m.cpu}%</td>}
                  {isAdmin && <td>{m.ram}%</td>}
                  <td>
                    <span className={`badge ${m.status === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Graphiques */}
      {hasData && (
        <>
          <div className="dashboard-grid">
            <div className="chart-card">
              <h3>Accuracy par Epoch</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 1]} stroke="#64748b" fontSize={12} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v) => `${(v * 100).toFixed(2)}%`}
                  />
                  <Legend />
                  {lineKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Loss par Epoch</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v) => v.toFixed(4)}
                  />
                  <Legend />
                  {lineKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {isAdmin && (
            <div className="dashboard-grid" style={{ marginTop: 'var(--space-lg)' }}>
              <div className="chart-card">
                <h3>CPU — Utilisation (%)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={cpuData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                    <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v) => `${v}%`}
                    />
                    <Legend />
                    {lineKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>RAM — Utilisation (%)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ramData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                    <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v) => `${v}%`}
                    />
                    <Legend />
                    {lineKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {!hasData && models.length === 0 && (
        <div className="card empty-state">
          <p>📊 Aucune donnée de training disponible</p>
          <span>Lancez un entraînement via <code>docker-compose up</code> pour voir les métriques ici</span>
        </div>
      )}
    </div>
  )
}

export default Dashboard