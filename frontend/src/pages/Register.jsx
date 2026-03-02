import { useState } from 'react'

function Register({ onSuccess }) {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '' })
  const [message, setMessage] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: appeler POST /auth/register sur FastAPI
    setMessage('Inscription réussie ! Vous pouvez vous connecter.')
    setTimeout(onSuccess, 1500)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Inscription</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
        </div>
        <div>
          <input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} required />
        </div>
        <div>
          <input name="email" type="email" placeholder="Adresse mail" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required />
        </div>
        <br />
        <button type="submit">S'inscrire</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Register