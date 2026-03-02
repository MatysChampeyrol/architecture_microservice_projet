import { useState } from 'react'

function Login({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: appeler POST /auth/login sur FastAPI
    // Pour l'instant : mock — email contenant "admin" => role admin
    const role = form.email.includes('admin') ? 'admin' : 'user'
    onSuccess({ email: form.email, role })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input name="email" type="email" placeholder="Adresse mail" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required />
        </div>
        <br />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default Login