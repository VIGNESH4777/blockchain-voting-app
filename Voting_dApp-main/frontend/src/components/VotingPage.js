import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useNavigate } from 'react-router-dom';

const VotingPage = () => {
  const { account, contract } = useWeb3();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const [timer, setTimer] = useState({ start: 0, end: 0 });
  const [timeStatus, setTimeStatus] = useState(''); // 'Upcoming', 'Active', 'Ended'
  const [timeLeft, setTimeLeft] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!account) navigate('/login');
  }, [account, navigate]);

  const loadElections = useCallback(async () => {
    if (!contract) return;
    try {
      const count = await contract.methods.getElectionCount().call();
      const list = [];
      for (let i = 1; i <= parseInt(count); i++) {
        const name = await contract.methods.getElectionName(i).call();
        list.push({ id: i, name });
      }
      setElections(list);
      if (list.length > 0 && !selectedElection) setSelectedElection(list[0].id);
    } catch (err) {
      console.error(err);
    }
  }, [contract, selectedElection]);

  const loadElectionDetails = useCallback(async (id) => {
    if (!contract || !id) return;
    try {
      // Load Candidates
      const cands = await contract.methods.getCandidates(id).call();
      setCandidates(cands);

      // Check Status
      const votersList = await contract.methods.getVoters(id).call({ from: account });
      const registered = votersList.includes(account);
      setIsRegistered(registered);

      // Load Timer
      const times = await contract.methods.getElectionTimer(id).call();
      setTimer({ start: parseInt(times[0]), end: parseInt(times[1]) });

    } catch (err) {
      console.error(err);
    }
  }, [contract, account]);

  useEffect(() => { loadElections(); }, [loadElections]);

  useEffect(() => {
    if (selectedElection) loadElectionDetails(selectedElection);
  }, [selectedElection, loadElectionDetails]);

  // Timer Tick
  useEffect(() => {
    if (!timer.start && !timer.end) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      if (now < timer.start) {
        setTimeStatus('Upcoming');
        setTimeLeft(`Starts in: ${new Date(timer.start * 1000).toLocaleString()}`);
      } else if (now > timer.end) {
        setTimeStatus('Ended');
        setTimeLeft(`Ended on: ${new Date(timer.end * 1000).toLocaleString()}`);
      } else {
        setTimeStatus('Active');
        const diff = timer.end - now;
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setTimeLeft(`Time Remaining: ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);


  /* -------------------------------------------------------------
     * NEW: 120s Session Timer Logic (Client-Side)
     * ------------------------------------------------------------- */
  const [votingDuration, setVotingDuration] = useState(120);

  useEffect(() => {
    if (votingDuration <= 0) return;
    const interval = setInterval(() => {
      setVotingDuration((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [votingDuration]);

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  /* ------------------------------------------------------------- */

  const handleVote = async (index) => {
    if (!contract || !selectedElection) return;
    try {
      await contract.methods.vote(selectedElection, index).send({ from: account });
      alert("Vote Cast Successfully!");
      setHasVoted(true);
    } catch (err) {
      alert("Voting Failed: " + (err.message || "Unknown error"));
    }
  };

  if (!account) return null;

  return (
    <div className="page-container">
      <h2>Voting Booth</h2>

      {/* NEW: Session Timer Display */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          padding: '10px 20px',
          borderRadius: '8px',
          backgroundColor: votingDuration < 10 ? '#FEE2E2' : '#E1EFFE',
          border: `2px solid ${votingDuration < 10 ? '#EF4444' : '#3B82F6'}`,
          color: votingDuration < 10 ? '#EF4444' : '#1E40AF',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        ⏱ Session Time: {formatTime(votingDuration)}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3>Select Election</h3>
        <select value={selectedElection || ''} onChange={e => setSelectedElection(parseInt(e.target.value))}>
          {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {selectedElection && (
        <div className="card" style={{ padding: 16, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Candidates</h3>
            <div style={{
              padding: '8px 15px',
              borderRadius: '8px',
              fontWeight: 'bold',
              backgroundColor: timeStatus === 'Active' ? '#DEF7EC' : (timeStatus === 'Upcoming' ? '#FEECDC' : '#FDE8E8'),
              color: timeStatus === 'Active' ? '#03543F' : (timeStatus === 'Upcoming' ? '#92400E' : '#9B1C1C'),
              border: '1px solid',
              borderColor: timeStatus === 'Active' ? '#84E1BC' : (timeStatus === 'Upcoming' ? '#FCD34D' : '#F8B4B4')
            }}>
              {timeStatus === 'Active' && '🟢 Voting Open'}
              {timeStatus === 'Upcoming' && '🟡 Starts Soon'}
              {timeStatus === 'Ended' && '🔴 Voting Closed'}
            </div>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: '500', color: '#555' }}>
            {timeLeft}
          </div>

          {/* Warning text if session is expiring */}
          {votingDuration < 10 && votingDuration > 0 && (
            <p style={{ color: 'red', fontWeight: 'bold' }}>Hurry! Session expiring soon!</p>
          )}
          {votingDuration === 0 && (
            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2rem' }}>⚠️ Session Expired. Please refresh to vote.</p>
          )}

          {candidates.length === 0 ? <p>No candidates found.</p> : (
            <div className="candidate-grid">
              {candidates.map((name, i) => (
                <div key={i} className="candidate-card">
                  <h4>{name}</h4>
                  <button
                    className="button"
                    // Modified Disabled Logic to include votingDuration === 0
                    disabled={!isRegistered || hasVoted || timeStatus !== 'Active' || votingDuration === 0}
                    onClick={() => handleVote(i)}
                    style={{
                      backgroundColor: (timeStatus !== 'Active' || votingDuration === 0) ? '#9CA3AF' : undefined,
                      cursor: (timeStatus !== 'Active' || votingDuration === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {hasVoted ? "Voted" : (
                      votingDuration === 0 ? "Time Expired" :
                        (timeStatus === 'Upcoming' ? "Wait to Start" : (timeStatus === 'Ended' ? "Election Ended" : "Vote"))
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isRegistered && <p style={{ color: 'red', marginTop: 10 }}>You are not registered for this election.</p>}
        </div>
      )}
    </div>
  );
};

export default VotingPage;