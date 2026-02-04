import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import homeBg from '../assets/home-bg.png';
import { useWeb3 } from '../contexts/Web3Context';
import UserProfile from './UserProfile';

const HomePage = () => {
    const { account } = useWeb3();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = React.useState(false);

    // Determine mobile number from localStorage based on loaded user data logic
    // We need to find which user is logged in. 
    // In LoginPage, we don't persist the "current user mobile" in global context, 
    // but we can infer or pass it. 
    // For this specific requirement, let's look for the most recent login or a specific key.
    // However, since we don't have a "current session" object, I'll check if a user is stored.
    // A better way is to save 'currentUserMobile' in localStorage on login.
    // I will assume 'currentUserMobile' is set, or I'll implement it now in LoginPage.
    // For now, let's try to find a user in localStorage that matches the logged in state, 
    // OR we can just check if the hardcoded user is intended.
    // Actually, I should update LoginPage to save 'currentUserMobile'.

    // Let's assume for this specific demo the user just logged in.
    const currentUserMobile = localStorage.getItem('currentUserMobile');

    useEffect(() => {
        if (!account) {
            navigate('/login');
        }
    }, [account, navigate]);

    if (!account) return null; // Don't render anything while redirecting

    return (
        <div className="page-container" style={{
            backgroundImage: `url(${homeBg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            maxWidth: '100%',
            margin: '-2rem -1rem',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1F2937',
            padding: '2rem',
            boxSizing: 'border-box'
        }}>
            <h2 style={{
                color: '#111827',
                textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8)',
                fontWeight: '800'
            }}>Welcome to One Nation One Election</h2>

            <p className="page-description" style={{
                color: '#374151',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '1rem',
                borderRadius: '8px',
                fontWeight: '600',
                marginBottom: '20px'
            }}>
                A visionary reform to uphold democratic integrity, national unity, and continuous growth across the country.
            </p>

            {/* Profile Button MOVED TO NAVBAR */}

            <div className="card-container">
                {/* Only show Admin card if logged in as Admin */}
                {localStorage.getItem('adminToken') ? (
                    <div className="card">
                        <h3>For Election Administrators</h3>
                        <p>Set up your election, register eligible voters, and ensure a fair process from start to finish.</p>
                        <Link to="/admin" className="button">Admin Dashboard</Link>
                    </div>
                ) : (
                    <div className="card">
                        <h3>For Voters</h3>
                        <p>Cast your vote with confidence, knowing your choice is secure and the results are transparent and tamper-proof.</p>
                        <Link to="/vote" className="button">Go to Voting Booth</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;