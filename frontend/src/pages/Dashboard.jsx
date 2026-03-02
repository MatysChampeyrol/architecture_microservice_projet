import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const MODELS = [
  { id: 1, name: 'Model Alpha', accuracy: 94.2, speed: '12ms', status: 'actif' },
  { id: 2, name: 'Model Beta', accuracy: 87.5, speed: '8ms', status: 'actif' },
  { id: 3, name: 'Model Gamma', accuracy: 91.0, speed: '15ms', status: 'inactif' },
]

function genData() {
  return Array.from({ length: 10 }, (_, i) => ({ t: i, v: Math.floor(Math.random() * 100) }))
}

function Dashboard({ user }) {
  const [accuracy, setAccuracy] = useState(genData)
  const [speed, setSpeed] = useState(genData)
  const [cpu, setCpu] = useState(genData)
  const [ram, setRam] = useState(genData)

  useEffect(() => {
    const interval = setInterval(() => {
      setAccuracy(genData())
      setSpeed(genData())
      setCpu(genData())
      setRam(genData())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Dashboard</h2>

      <h3>Modèles</h3>
      <table border="1" cellPadding="8" style={{ margin: '0 auto' }}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Précision</th>
            <th>Vitesse</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {MODELS.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.accuracy}%</td>
              <td>{m.speed}</td>
              <td>{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Précision du modèle</h3>
      <LineChart width={400} height={200} data={accuracy}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="v" dot={false} isAnimationActive={false} />
      </LineChart>

      <h3>Vitesse d'exécution (ms)</h3>
      <LineChart width={400} height={200} data={speed}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="v" dot={false} isAnimationActive={false} />
      </LineChart>

      {isAdmin && (
        <>
          <h3>CPU — utilisation vs machine hôte (%)</h3>
          <LineChart width={400} height={200} data={cpu}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="v" dot={false} isAnimationActive={false} />
          </LineChart>

          <h3>RAM — utilisation vs machine hôte (%)</h3>
          <LineChart width={400} height={200} data={ram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="v" dot={false} isAnimationActive={false} />
          </LineChart>
        </>
      )}
    </div>
  )
}

export default Dashboard