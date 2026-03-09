import { useState } from 'react'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import CGU from './pages/CGU'
import Menu from './components/Menu'

function App() {
  const [page, setPage] = useState('dashboard')
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  function handleLogin(userData) {
    // Stocker le token séparément pour les futures requêtes authentifiées
    const { access_token, ...userInfo } = userData
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('user', JSON.stringify(userInfo))
    setUser(userInfo)
    setPage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    setUser(null)
    setPage('login')
  }

  if (!user) {
    return (
      <div className="auth-container">
        {page === 'register'
          ? <Register onSuccess={() => setPage('login')} />
          : <Login onSuccess={handleLogin} />
        }
        <div className="auth-card switch-link" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '1rem' }}>
          {page === 'register'
            ? <span>Déjà un compte ? <button onClick={() => setPage('login')}>Se connecter</button></span>
            : <span>Pas de compte ? <button onClick={() => setPage('register')}>S'inscrire</button></span>
          }
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Menu page={page} setPage={setPage} onLogout={handleLogout} />
      <main className="app-content">
        {page === 'dashboard' && <Dashboard user={user} />}
        {page === 'contacts' && <Contacts />}
        {page === 'cgu' && <CGU />}
      </main>
    </div>
  )
}

export default App