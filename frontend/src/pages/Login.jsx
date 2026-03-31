import { useState } from 'react'

function Login({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) {
        setError(data.detail || 'Erreur de connexion')
        return
      }

      onSuccess({
        ...data.user,
        access_token: data.access_token
      })
    } catch (err) {
      console.error(err)
      setError('Le serveur ne répond pas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Adresse mail"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <input
          name="password"
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      {error && <p className="msg-error" style={{ marginTop: '1rem' }}>{error}</p>}
    </div>
  )
}

export default Login