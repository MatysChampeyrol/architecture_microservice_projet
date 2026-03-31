import { useState } from 'react'

function Register({ onSuccess }) {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.prenom,
          last_name: form.nom,
          email: form.email,
          password: form.password,
          role: 'user'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || "Erreur lors de l'inscription")
        return
      }

      setMessage('Inscription réussie ! Redirection…')
      setTimeout(onSuccess, 1500)
    } catch (err) {
      console.error(err)
      setError('Le serveur ne répond pas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Inscription</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
          required
          autoComplete="family-name"
        />
        <input
          name="prenom"
          placeholder="Prénom"
          value={form.prenom}
          onChange={handleChange}
          required
          autoComplete="given-name"
        />
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
          autoComplete="new-password"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création…' : "S'inscrire"}
        </button>
      </form>
      {message && <p className="msg-success" style={{ marginTop: '1rem' }}>{message}</p>}
      {error && <p className="msg-error" style={{ marginTop: '1rem' }}>{error}</p>}
    </div>
  )
}

export default Register