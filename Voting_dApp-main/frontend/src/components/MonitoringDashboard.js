import React, { useEffect, useState } from 'react';

const MonitoringDashboard = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Load logs from local storage
        const storedLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        setLogs(storedLogs);

        // Optional: Poll for changes every few seconds to make it feel "immediate" without refresh
        const interval = setInterval(() => {
            const current = JSON.parse(localStorage.getItem('security_logs') || '[]');
            // Simple comparison or just set it
            setLogs(current);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-grid">
            {/* 1. KEY METRICS */}
            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="stat-card" style={statCardStyle}>
                    <h3>Total Registered Voters</h3>
                    <p className="stat-value">1,024,567</p>
                    <span className="stat-trend positive">↑ 12% today</span>
                </div>
                <div className="stat-card" style={statCardStyle}>
                    <h3>Active Polling Stations</h3>
                    <p className="stat-value">845 / 850</p>
                    <span className="stat-trend positive">99.4% Online</span>
                </div>
                <div className="stat-card" style={statCardStyle}>
                    <h3>Security Alerts</h3>
                    <p className="stat-value" style={{ color: logs.length > 0 ? '#EF4444' : '#10B981' }}>{logs.length}</p>
                    <span className="stat-trend" style={{ color: logs.length > 0 ? '#EF4444' : '#10B981' }}>
                        {logs.length > 0 ? 'Action Required' : 'System Secure'}
                    </span>
                </div>
                <div className="stat-card" style={statCardStyle}>
                    <h3>System Alerts</h3>
                    <p className="stat-value" style={{ color: '#F59E0B' }}>3 Warnings</p>
                    <span className="stat-trend negative">Check Logs</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                {/* 2. LIVE MAP (Placeholder Visual) */}
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3>Live Election Heatmap</h3>
                    <div style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: '8px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#6b7280' }}>[Live India Map Visualization Loaded]</p>
                        {/* Simple pulse animations to simulate live data */}
                        <div className="pulse" style={{ top: '30%', left: '40%' }}></div>
                        <div className="pulse" style={{ top: '60%', left: '30%' }}></div>
                        <div className="pulse" style={{ top: '45%', left: '70%' }}></div>
                        <div className="pulse" style={{ top: '20%', left: '80%' }}></div>
                        <div className="pulse" style={{ top: '80%', left: '50%' }}></div>
                    </div>
                </div>

                {/* 3. ALERTS & LOGS */}
                <div className="card" style={{ height: '400px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Security Logs</h3>
                        {logs.length > 0 &&
                            <button onClick={() => { localStorage.removeItem('security_logs'); setLogs([]); }} style={{ fontSize: '0.8rem', color: 'red', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear Logs</button>
                        }
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {logs.length === 0 && (
                            <li style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>No security threats detected.</li>
                        )}
                        {logs.map((log) => (
                            <li key={log.id} style={alertItemStyle}>
                                <span className={`dot ${log.severity === 'High' ? 'error' : 'warning'}`}></span>
                                <div>
                                    <strong style={{ color: log.severity === 'High' ? '#DC2626' : '#F59E0B' }}>{log.type}</strong>
                                    <p>{log.detail}</p>
                                </div>
                                <small style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9CA3AF' }}>{log.timestamp}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <style>{`
        .stat-card {
           background: white;
           padding: 20px;
           border-radius: 12px;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .stat-value {
           font-size: 2rem;
           font-weight: bold;
           margin: 10px 0;
           color: #111827;
        }
        .stat-trend {
           font-size: 0.875rem;
           padding: 4px 8px;
           border-radius: 999px;
        }
        .positive { background: #DCFCE7; color: #166534; }
        .negative { background: #FEE2E2; color: #991B1B; }
        .neutral { background: #F3F4F6; color: #374151; }
        
        .pulse {
           position: absolute;
           width: 15px;
           height: 15px;
           background: rgba(220, 38, 38, 0.7);
           border-radius: 50%;
           animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
           0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
           70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
           100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }
        .dot.online { background: #10B981; }
        .dot.warning { background: #F59E0B; }
        .dot.error { background: #EF4444; }
      `}</style>
        </div>
    );
};

const statCardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
};

const alertItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
    gap: '10px'
};

export default MonitoringDashboard;
