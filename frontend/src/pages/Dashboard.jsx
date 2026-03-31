import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const API = import.meta.env.VITE_API_URL

function Dashboard({ user }) {
  const [models, setModels] = useState([])
  const [metricsData, setMetricsData] = useState([])
  const [systemData, setSystemData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'
  const token = localStorage.getItem('access_token')

  const fetchMetrics = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [summaryRes, metricsRes] = await Promise.all([
        fetch(`${API}/training/metrics/summary`, { headers }),
        fetch(`${API}/training/metrics`, { headers }),
      ])

      if (!summaryRes.ok || !metricsRes.ok) {
        throw new Error('Erreur lors du chargement des métriques')
      }

      setModels(await summaryRes.json())
      setMetricsData(await metricsRes.json())

      if (isAdmin) {
        const sysRes = await fetch(`${API}/training/metrics/system`, { headers })
        if (sysRes.ok) setSystemData(await sysRes.json())
      }

      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, isAdmin])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  function buildChartData(metric) {
    if (metricsData.length === 0) return []
    const maxEpochs = Math.max(...metricsData.map(m => m.metrics.length), 0)
    return Array.from({ length: maxEpochs }, (_, i) => {
      const point = { epoch: i + 1 }
      metricsData.forEach(m => {
        const label = `${m.library} / ${m.dataset}`
        if (m.metrics[i]) point[label] = m.metrics[i][metric]
      })
      return point
    })
  }

  function buildSystemChartData(metric) {
    if (systemData.length === 0) return []
    const maxEpochs = Math.max(...systemData.map(m => m.metrics.length), 0)
    return Array.from({ length: maxEpochs }, (_, i) => {
      const point = { epoch: i + 1 }
      systemData.forEach(m => {
        const label = `${m.library} / ${m.dataset}`
        if (m.metrics[i]) point[label] = m.metrics[i][metric]
      })
      return point
    })
  }

  const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#a855f7']

  const modelKeys = metricsData.map(m => `${m.library} / ${m.dataset}`)
  const systemKeys = systemData.map(m => `${m.library} / ${m.dataset}`)

  if (loading) {
    return (
      <div>
        <div className="spinner" />
        <p className="loading-text">Chargement des métriques…</p>
      </div>
    )
  }

  const hasData = metricsData.length > 0 && metricsData.some(m => m.metrics.length > 0)

  return (
    <div>
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Bienvenue, {user?.first_name || 'utilisateur'} - suivi en temps réel des entraînements</p>
      </div>

      {error && <p className="msg-error" style={{ marginBottom: '1rem' }}>{error}</p>}

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
                <th>Durée dernière epoch (s)</th>
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
                  <td>{m.execution_time.toFixed(2)}s</td>
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

      {hasData && (
        <>
          <div className="dashboard-grid">
            <div className="chart-card">
              <h3>Accuracy par Epoch</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={buildChartData('accuracy')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 1]} stroke="#64748b" fontSize={12} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={v => `${(v * 100).toFixed(2)}%`}
                  />
                  <Legend />
                  {modelKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Loss par Epoch</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={buildChartData('loss')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={v => v.toFixed(4)}
                  />
                  <Legend />
                  {modelKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="chart-card">
              <h3>Vitesse d'exécution par Epoch (s)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={buildChartData('execution_time')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `${v.toFixed(0)}s`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={v => `${v.toFixed(2)}s`}
                  />
                  <Legend />
                  {modelKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {isAdmin && systemData.length > 0 && (
            <div className="dashboard-grid" style={{ marginTop: 'var(--space-lg)' }}>
              <div className="chart-card">
                <h3>CPU - Utilisation (%)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={buildSystemChartData('cpu')}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                    <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={v => `${v}%`}
                    />
                    <Legend />
                    {systemKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>RAM - Utilisation (%)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={buildSystemChartData('ram')}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
                    <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#1e2235', border: '1px solid #2d3348', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={v => `${v}%`}
                    />
                    <Legend />
                    {systemKeys.map((key, i) => (
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
          <p>Aucune donnée de training disponible</p>
          <span>Lancez un entraînement via <code>docker-compose up</code> pour voir les métriques ici</span>
        </div>
      )}
    </div>
  )
}

export default Dashboard
