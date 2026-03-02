// d1n0
function Menu({ page, setPage, onLogout }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <button onClick={() => setPage('dashboard')} disabled={page === 'dashboard'}>Dashboard</button>
      {' '}
      <button onClick={() => setPage('contacts')} disabled={page === 'contacts'}>Contacts</button>
      {' '}
      <button onClick={() => setPage('cgu')} disabled={page === 'cgu'}>CGU</button>
      {' '}
      <button onClick={onLogout}>Déconnexion</button>
      <hr />
    </div>
  )
}

export default Menu