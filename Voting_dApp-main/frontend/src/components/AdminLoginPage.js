import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import homeBg from '../assets/home-bg.png';
import eciLogo from '../assets/eci-logo.png';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // If already logged in as admin, redirect to dashboard
        if (localStorage.getItem('adminToken')) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        const ADMIN_EMAIL = 'electionofindia.gov@gmail.com';
        const ADMIN_PASS = '1234';

        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            // Set token
            localStorage.setItem('adminToken', 'true');
            navigate('/admin');
        } else {
            setError('Invalid Administrator Credentials');
        }
    };

    return (
        <div style={{
            backgroundImage: `url(${homeBg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0
        }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '3rem',
                borderRadius: '20px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
                border: '2px solid #DC2626' // Red border for Admin distinction
            }}>
                <img src={eciLogo} alt="ECI Logo" style={{ height: '80px', marginBottom: '1.5rem' }} />

                <h1 style={{
                    color: '#DC2626', // Red color for Admin
                    marginBottom: '0.5rem',
                    fontSize: '1.8rem',
                    fontWeight: '800'
                }}>Administrator Login</h1>

                <p style={{
                    color: '#4B5563',
                    marginBottom: '2rem',
                    fontSize: '0.9rem'
                }}>
                    Restricted Access. Authorized Personnel Only.
                </p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Official Email ID"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            fontSize: '1rem'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            fontSize: '1rem'
                        }}
                    />

                    {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

                    <button
                        type="submit"
                        className="button"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            marginTop: '0.5rem',
                            backgroundColor: '#DC2626', // Red button
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                    >
                        Access Dashboard
                    </button>

                    <p
                        onClick={() => navigate('/')}
                        style={{
                            marginTop: '1rem',
                            color: '#4B5563',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '0.9rem'
                        }}
                    >
                        Return to Voter Login
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
