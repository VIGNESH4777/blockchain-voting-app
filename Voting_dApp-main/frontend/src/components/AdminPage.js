import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useNavigate } from 'react-router-dom';
import MonitoringDashboard from './MonitoringDashboard';



function parseList(input) {
  return input.split(',').map(s => s.trim()).filter(Boolean);
}

const AdminPage = () => {
  const { account, isAdmin, contract, owner, chainId, switchNetwork, connectWallet, getRevertReason } = useWeb3();
  const navigate = useNavigate();

  // Redirect if not logged in as Admin via Email
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // local state
  const [electionName, setElectionName] = useState('');
  const [candidatesCsv, setCandidatesCsv] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [elections, setElections] = useState([]); // { id, name }
  const [selectedElection, setSelectedElection] = useState(null);
  const [voterAddress, setVoterAddress] = useState('');
  const [bulkVotersCsv, setBulkVotersCsv] = useState('');
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text: string }
  const [voterList, setVoterList] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Clear message when account changes to prevent lingering errors
  useEffect(() => {
    setMessage(null);
  }, [account]);

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'management'

  const fetchElections = useCallback(async () => {
    if (!contract) return;
    try {
      const count = await contract.methods.getElectionCount().call();
      const arr = [];
      for (let i = 1; i <= parseInt(count); i++) {
        const name = await contract.methods.getElectionName(i).call();
        arr.push({ id: i, name });
      }
      setElections(arr);
      if (arr.length && !selectedElection) setSelectedElection(arr[0].id);
    } catch (e) {
      setElections([]);
    }
  }, [contract, selectedElection]);

  const fetchSelectedDetails = useCallback(async (id) => {
    if (!contract || !id) return;
    try {
      const cand = await contract.methods.getCandidates(id).call();
      setCandidates(cand || []);
    } catch (e) {
      setCandidates([]);
    }
    try {
      const voters = await contract.methods.getVoters(id).call({ from: account });
      setVoterList(voters || []);
    } catch (e) {
      setVoterList([]); // if not owner or no getter, clear or fallback
    }
  }, [contract, account]);

  useEffect(() => { fetchElections(); }, [fetchElections]);

  useEffect(() => {
    if (selectedElection) fetchSelectedDetails(selectedElection);
  }, [selectedElection, fetchSelectedDetails]);

  const showError = (text) => setMessage({ type: 'error', text });
  const showSuccess = (text) => setMessage({ type: 'success', text });

  const handleCreateElection = async () => {
    if (!contract || !isAdmin) { showError('Only admin can create elections.'); return; }
    const names = parseList(candidatesCsv);
    if (!electionName || names.length === 0) { showError('Provide election name and candidate list.'); return; }
    if (!startTime || !endTime) { showError('Provide Start and End times.'); return; }

    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    if (endTimestamp <= startTimestamp) { showError('End time must be after Start time.'); return; }

    try {
      showSuccess('Creating election...');
      await contract.methods.createElection(electionName, names, startTimestamp, endTimestamp).send({ from: account });
      showSuccess('Election created.');
      setElectionName('');
      setCandidatesCsv('');
      setStartTime('');
      setEndTime('');
      await fetchElections();
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  const handleRegisterVoter = async () => {
    if (!contract || !isAdmin || !selectedElection) { showError('Select election and ensure you are admin.'); return; }
    if (!voterAddress) { showError('Enter voter address.'); return; }
    try {
      showSuccess('Registering voter...');
      await contract.methods.registerVoterForElection(selectedElection, voterAddress).send({ from: account });
      showSuccess('Voter registered.');
      setVoterAddress('');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  const handleRegisterBulk = async () => {
    if (!contract || !isAdmin || !selectedElection) { showError('Select election and ensure you are admin.'); return; }
    const list = parseList(bulkVotersCsv);
    if (list.length === 0) { showError('Enter addresses separated by commas.'); return; }
    try {
      showSuccess('Registering voters...');
      await contract.methods.registerVotersForElection(selectedElection, list).send({ from: account });
      showSuccess('Bulk registration complete.');
      setBulkVotersCsv('');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  const handleRemoveVoter = async (voterAddr) => {
    if (!contract || !isAdmin || !selectedElection) { showError('Select election and ensure you are admin.'); return; }
    try {
      showSuccess('Removing voter...');
      await contract.methods.removeVoter(selectedElection, voterAddr).send({ from: account });
      showSuccess('Voter removed successfully.');
      await fetchSelectedDetails(selectedElection);
    } catch (err) {
      showError(getRevertReason(err));
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Admin Portal</h2>
        {/* Tab Navigation */}
        {account && isAdmin && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={activeTab === 'dashboard' ? 'button' : ''}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'dashboard' ? '#2563EB' : '#E5E7EB',
                color: activeTab === 'dashboard' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Monitoring Dashboard
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={activeTab === 'management' ? 'button' : ''}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'management' ? '#2563EB' : '#E5E7EB',
                color: activeTab === 'management' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Election Management
            </button>
          </div>
        )}
      </div>

      {!account && (
        <div className="card" style={{ padding: 16 }}>
          <p>Please connect your Admin Wallet (Owner) to proceed.</p>
          <button
            className="button"
            onClick={connectWallet}
            style={{ marginTop: '10px', width: 'auto', padding: '10px 20px' }}
          >
            Connect Wallet
          </button>
        </div>
      )}

      {account && !isAdmin && (
        <div className="card" style={{ borderLeft: '4px solid #dc2626', backgroundColor: '#fff5f5', color: '#7f1d1d', padding: 16 }}>
          <h3 style={{ margin: 0 }}>Access Denied</h3>
          <p style={{ margin: '8px 0 0' }}>
            Connect with the admin account to access this page.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12 }}>
            Contract owner: <strong style={{ color: '#7f1d1d' }}>{owner || 'not loaded'}</strong><br />
            Current Chain ID: {chainId} (Expected: 1337)<br />
            Connected Account: <strong>{account || 'none'}</strong>
          </p>
          {chainId !== 1337 && (
            <button style={{ marginTop: 8, backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }} onClick={switchNetwork}>
              Switch to Localhost 8545
            </button>
          )}
          {chainId === 1337 && (
            <button style={{ marginTop: 8, marginLeft: 8, backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }} onClick={() => window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] }).then(() => window.location.reload())}>
              Connect Different Account
            </button>
          )}
        </div>
      )}

      {
        account && isAdmin && (
          <>
            {activeTab === 'dashboard' && <MonitoringDashboard />}

            {activeTab === 'management' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                {/* Management Content Wrapper */}
                <div className="card" style={{ padding: 16 }}>
                  <h3>Create New Election</h3>
                  <input type="text" placeholder="Election name" value={electionName} onChange={e => setElectionName(e.target.value)} />
                  <input type="text" placeholder="Candidates (comma separated)" value={candidatesCsv} onChange={e => setCandidatesCsv(e.target.value)} />

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', color: '#666' }}>Start Time</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', color: '#666' }}>End Time</label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <button onClick={handleCreateElection} style={{ marginTop: '15px' }}>Create Election</button>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <h3>Existing Elections</h3>
                  <select value={selectedElection || ''} onChange={e => setSelectedElection(parseInt(e.target.value))}>
                    {elections.map(ev => <option key={ev.id} value={ev.id}>{ev.id} — {ev.name}</option>)}
                    {elections.length === 0 && <option value=''>No elections</option>}
                  </select>
                  <div style={{ marginTop: 12 }}>
                    <h4>Candidates</h4>
                    <ul>{candidates.map((c, i) => <li key={i}>{i}: {c}</li>)}</ul>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <h4>Register Voters</h4>
                    <input type="text" placeholder="Single voter address" value={voterAddress} onChange={e => setVoterAddress(e.target.value)} />
                    <button onClick={handleRegisterVoter}>Register Voter</button>
                    <p style={{ marginTop: 8 }}>Or bulk (comma separated):</p>
                    <input type="text" placeholder="addr1, addr2, ..." value={bulkVotersCsv} onChange={e => setBulkVotersCsv(e.target.value)} />
                    <button onClick={handleRegisterBulk}>Register Bulk</button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <h4>Registered Voters ({voterList.length})</h4>
                    <ul className="voter-list">
                      {voterList.map((v, i) => (
                        <li key={v + i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span>{v}</span>
                          <button
                            onClick={() => handleRemoveVoter(v)}
                            style={{ padding: '4px 8px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      }

      {
        message && (
          <div
            className="card"
            style={{
              marginTop: 12,
              padding: 12,
              borderLeft: message.type === 'error' ? '4px solid #dc2626' : '4px solid #16a34a',
              backgroundColor: message.type === 'error' ? '#fff5f5' : '#f0fff4',
              color: message.type === 'error' ? '#7f1d1d' : '#065f46'
            }}
          >
            <p style={{ margin: 0 }}>{message.text}</p>
          </div>
        )
      }
    </div >
  );
};

export default AdminPage;