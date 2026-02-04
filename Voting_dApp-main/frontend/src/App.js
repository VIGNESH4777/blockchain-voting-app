import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import VotingPage from './components/VotingPage';
import HowToUsePage from './components/HowToUsePage';
import LoginPage from './components/LoginPage';
import AdminLoginPage from './components/AdminLoginPage';
import { Web3Provider, useWeb3 } from './contexts/Web3Context';
import './App.css';
import eciLogo from './assets/eci-logo.png';
import UserProfile from './components/UserProfile';

// Navbar consumes context (must be inside provider)
const NavBar = () => {
  const { isOwner, owner, account, logout } = useWeb3(); // Assuming 'isOwner' or just check account against owner
  const [showProfile, setShowProfile] = React.useState(false);
  const currentUserMobile = localStorage.getItem('currentUserMobile');

  // Don't show navbar on login page (account null check handled by router below, but safety check here)
  if (!account) return null;

  return (
    <>
      <header className="app-header">
        <Link to="/" className="logo">
          <img src={eciLogo} alt="ECI Logo" style={{ height: '50px', marginRight: '15px' }} />
          Ek Rashtr Ek Chunaav
        </Link>
        <nav>
          <Link to="/">Home</Link>

          {localStorage.getItem('adminToken') ? (
            <Link to="/admin">Admin Dashboard</Link>
          ) : (
            <>
              <Link to="/vote">Voting Booth</Link>
              <Link to="/how-to-use">How to Use</Link>
            </>
          )}
        </nav>
        <div style={{ marginLeft: 16, fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: '15px' }}>

          {/* PROFILE BUTTON - Left of Owner */}
          {!localStorage.getItem('adminToken') && (
            <button
              onClick={() => setShowProfile(true)}
              style={{
                background: 'none',
                border: '1px solid #2563EB',
                color: '#2563EB',
                padding: '5px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              👤 Profile
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>Owner</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {owner ? owner.substring(0, 6) + '...' + owner.substring(38) : '...'}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'none',
              border: '1px solid #EF4444',
              color: '#EF4444',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Render Profile Modal Globally */}
      {showProfile && (
        <UserProfile
          mobile={currentUserMobile || '7695963321'}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App">
          <NavBar />
          <main>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/" element={
                // Protected Route Logic could go here, or handled by HomePage redirecting if !account
                <HomePage />
              } />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/vote" element={<VotingPage />} />
              <Route path="/how-to-use" element={<HowToUsePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;