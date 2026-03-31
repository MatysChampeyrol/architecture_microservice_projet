import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const API = import.meta.env.VITE_API_URL

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899']

function Dashboard({ user }) {
  const [models, setModels] = useState([])
  const [metricsData, setMetricsData] = useState([])
  const [systemData, setSystemData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const summaryRes = await fetch(`${API}/training/metrics/summary`, { headers })
        const metricsRes = await fetch(`${API}/training/metrics`, { headers })

        if (!summaryRes.ok || !metricsRes.ok) {
          setError('Erreur lors du chargement des métriques')
          return
        }

        setModels(await summaryRes.json())
        setMetricsData(await metricsRes.json())

        if (isAdmin) {
          const sysRes = await fetch(`${API}/training/metrics/system`, { headers })
          if (sysRes.ok) {
            setSystemData(await sysRes.json())
          }
        }
      } catch (err) {
        setError('Impossible de contacter le serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [token, isAdmin])

  function getChartData(source, metric) {
    if (source.length === 0) return []
    const maxEpochs = Math.max(...source.map(m => m.metrics.length))
    const data = []
    for (let i = 0; i < maxEpochs; i++) {
      const point = { epoch: i + 1 }
      for (const m of source) {
        const label = m.library + ' / ' + m.dataset
        if (m.metrics[i]) {
          point[label] = m.metrics[i][metric]
        }
      }
      data.push(point)
    }
    return data
  }

  if (loading) {
    return <p>Chargement...</p>
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Bienvenue {user?.first_name}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Resultats</h3>
      {models.length === 0 ? (
        <p>Aucun modele en cours d'entrainement</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Modele</th>
              <th>Epochs</th>
              <th>Accuracy</th>
              <th>Loss</th>
              <th>Duree derniere epoch (s)</th>
              {isAdmin && <th>CPU %</th>}
              {isAdmin && <th>RAM %</th>}
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={i}>
                <td>{m.name}</td>
                <td>{m.epochs_completed}</td>
                <td>{(m.accuracy * 100).toFixed(1)}%</td>
                <td>{m.loss.toFixed(4)}</td>
                <td>{m.execution_time.toFixed(2)}s</td>
                {isAdmin && <td>{m.cpu}%</td>}
                {isAdmin && <td>{m.ram}%</td>}
                <td>{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {metricsData.length > 0 && (
        <div>
          <h3>Accuracy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getChartData(metricsData, 'accuracy')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" />
              <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={v => `${(v * 100).toFixed(2)}%`} />
              <Legend />
              {metricsData.map((m, i) => (
                <Line key={i} type="monotone" dataKey={m.library + ' / ' + m.dataset} stroke={COLORS[i % COLORS.length]} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <h3>Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getChartData(metricsData, 'loss')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" />
              <YAxis />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend />
              {metricsData.map((m, i) => (
                <Line key={i} type="monotone" dataKey={m.library + ' / ' + m.dataset} stroke={COLORS[i % COLORS.length]} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <h3>Vitesse d'execution par epoch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getChartData(metricsData, 'execution_time')}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" />
              <YAxis tickFormatter={v => `${v.toFixed(0)}s`} />
              <Tooltip formatter={v => `${v.toFixed(2)}s`} />
              <Legend />
              {metricsData.map((m, i) => (
                <Line key={i} type="monotone" dataKey={m.library + ' / ' + m.dataset} stroke={COLORS[i % COLORS.length]} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {isAdmin && systemData.length > 0 && (
            <div>
              <h3>CPU (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData(systemData, 'cpu')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  {systemData.map((m, i) => (
                    <Line key={i} type="monotone" dataKey={m.library + ' / ' + m.dataset} stroke={COLORS[i % COLORS.length]} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <h3>RAM (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData(systemData, 'ram')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  {systemData.map((m, i) => (
                    <Line key={i} type="monotone" dataKey={m.library + ' / ' + m.dataset} stroke={COLORS[i % COLORS.length]} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
