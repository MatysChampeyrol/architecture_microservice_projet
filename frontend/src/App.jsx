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
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setPage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('user')
    setUser(null)
    setPage('login')
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {page === 'register' ? <Register onSuccess={() => setPage('login')} /> : <Login onSuccess={handleLogin} />}
        <br />
        {page === 'register'
          ? <span>Déjà un compte ? <button onClick={() => setPage('login')}>Se connecter</button></span>
          : <span>Pas de compte ? <button onClick={() => setPage('register')}>S'inscrire</button></span>
        }
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
      <Menu page={page} setPage={setPage} onLogout={handleLogout} />
      {page === 'dashboard' && <Dashboard user={user} />}
      {page === 'contacts' && <Contacts />}
      {page === 'cgu' && <CGU />}
    </div>
  )
}

export default App