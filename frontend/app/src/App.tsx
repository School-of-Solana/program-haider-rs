import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Poll, Candidate, getAllPolls, getCandidatesForPoll, checkIfVoted } from './solana';
import { initializePoll, addCandidate, castVote } from './instructions';
import './index.css';

function formatAddress(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

function getPollStatus(start: number, end: number) {
  const now = Math.floor(Date.now() / 1000);
  if (now < start) return 'not_started';
  if (now > end) return 'ended';
  return 'active';
}

function getTimeRemaining(start: number, end: number): string {
  const now = Math.floor(Date.now() / 1000);
  if (now < start) return `Starts in ${formatDuration(start - now)}`;
  if (now > end) return 'Ended';
  return `${formatDuration(end - now)} remaining`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

interface CreatePollModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (desc: string, start: number, end: number) => Promise<void>;
  loading: boolean;
}

function CreatePollModal({ show, onClose, onSubmit, loading }: CreatePollModalProps) {
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (show) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      setDescription('');
      setStartDate(now.toISOString().split('T')[0]);
      setStartTime(now.toTimeString().slice(0, 5));
      setEndDate(tomorrow.toISOString().split('T')[0]);
      setEndTime(tomorrow.toTimeString().slice(0, 5));
      setLocalError('');
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!description.trim()) {
      setLocalError('Please enter a description');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setLocalError('Please fill in all date and time fields');
      return;
    }

    const start = Math.floor(new Date(`${startDate}T${startTime}`).getTime() / 1000);
    const end = Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    if (start >= end) {
      setLocalError('End time must be after start time');
      return;
    }

    if (start < now - 300) {
      setLocalError('Start time cannot be in the past');
      return;
    }

    try {
      await onSubmit(description, start, end);
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create poll');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Poll</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Poll Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter poll description"
              disabled={loading}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="start-time">Start Time</label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="end-time">End Time</label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {localError && <div className="error">{localError}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddCandidateModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  loading: boolean;
}

function AddCandidateModal({ show, onClose, onSubmit, loading }: AddCandidateModalProps) {
  const [candidateName, setCandidateName] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (show) {
      setCandidateName('');
      setLocalError('');
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!candidateName.trim()) {
      setLocalError('Please enter a candidate name');
      return;
    }

    try {
      await onSubmit(candidateName);
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to add candidate');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Candidate</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="candidate-name">Candidate Name</label>
            <input
              id="candidate-name"
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter candidate name"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {localError && <div className="error">{localError}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const wallet = useWallet();
  const [view, setView] = useState<'home' | 'poll'>('home');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  const fetchPolls = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPolls();
      setPolls(data.sort((a, b) => Number(b.pollId) - Number(a.pollId)));
    } catch (err) {
      setError('Failed to fetch polls');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolls();
    const interval = setInterval(fetchPolls, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleViewPoll = async (poll: Poll) => {
    setLoading(true);
    setError(null);
    try {
      setSelectedPoll(poll);
      const cands = await getCandidatesForPoll(poll.pollId);
      setCandidates(cands);

      if (wallet.publicKey) {
        const voted = await checkIfVoted(poll.pollId, wallet.publicKey);
        setHasVoted(voted);
      }

      setView('poll');
    } catch (err) {
      setError('Failed to load poll details');
    }
    setLoading(false);
  };

  const handleCreatePoll = async (description: string, start: number, end: number) => {
    setLoading(true);
    setError(null);
    try {
      // Ensure pollId is properly converted to bigint
      const pollId = BigInt(Math.floor(Date.now() / 1000)); // Use seconds instead of milliseconds
      await initializePoll(wallet, pollId, description, start, end);
      await fetchPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (name: string) => {
    if (!selectedPoll) return;

    setLoading(true);
    setError(null);
    try {
      await addCandidate(wallet, selectedPoll.pollId, selectedPoll.candidateCount, name);
      const cands = await getCandidatesForPoll(selectedPoll.pollId);
      setCandidates(cands);

      const updatedPolls = await getAllPolls();
      setPolls(updatedPolls.sort((a, b) => Number(b.pollId) - Number(a.pollId)));
      const updatedPoll = updatedPolls.find(p => p.pollId === selectedPoll.pollId);
      if (updatedPoll) setSelectedPoll(updatedPoll);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add candidate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId: bigint) => {
    if (!selectedPoll) return;

    setLoading(true);
    setError(null);
    try {
      await castVote(wallet, selectedPoll.pollId, candidateId);
      setHasVoted(true);
      const cands = await getCandidatesForPoll(selectedPoll.pollId);
      setCandidates(cands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Solana Polls</h1>
        <div className="header-actions">
          {view === 'home' && (
            <button
              onClick={() => setShowCreatePollModal(true)}
              className="btn-primary"
              disabled={!wallet.publicKey || loading}
            >
              Create Poll
            </button>
          )}
          <WalletMultiButton />
        </div>
      </header>

      <main className="main">
        {view === 'home' ? (
          <div className="home">
            <div className="page-header">
              <h2>All Polls</h2>
              <button onClick={fetchPolls} className="btn-refresh" disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            {loading && polls.length === 0 ? (
              <div className="loading">Loading polls...</div>
            ) : polls.length === 0 ? (
              <div className="empty">No polls yet</div>
            ) : (
              <div className="polls-grid">
                {polls.map((poll) => {
                  const status = getPollStatus(Number(poll.startTime), Number(poll.endTime));
                  return (
                    <div
                      key={poll.pollId.toString()}
                      className="poll-card"
                      onClick={() => handleViewPoll(poll)}
                    >
                      <div className="card-header">
                        <h3>{poll.description}</h3>
                        <span className={`badge badge-${status}`}>{status.toUpperCase()}</span>
                      </div>
                      <p>ID: {poll.pollId.toString()}</p>
                      <p>Creator: {formatAddress(poll.creator.toBase58())}</p>
                      <p>Candidates: {poll.candidateCount.toString()}</p>
                      <p>{getTimeRemaining(Number(poll.startTime), Number(poll.endTime))}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : selectedPoll ? (
          <div className="poll-detail">
            <button onClick={() => setView('home')} className="btn-back">
              ← Back
            </button>

            <div className="poll-info">
              <h2>{selectedPoll.description}</h2>
              <p>Poll ID: {selectedPoll.pollId.toString()}</p>
              <p>Creator: {formatAddress(selectedPoll.creator.toBase58())}</p>
              <p>Start: {formatTime(Number(selectedPoll.startTime))}</p>
              <p>End: {formatTime(Number(selectedPoll.endTime))}</p>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="candidates-section">
              <h3>Candidates</h3>
              {candidates.length === 0 ? (
                <p className="empty">No candidates yet</p>
              ) : (
                <div className="candidates-list">
                  {candidates.map((cand) => {
                    const isActive = getPollStatus(Number(selectedPoll.startTime), Number(selectedPoll.endTime)) === 'active';
                    return (
                      <div key={cand.candidateId.toString()} className="candidate">
                        <div>
                          <h4>{cand.name}</h4>
                          <p>Votes: {cand.voteCount.toString()}</p>
                        </div>
                        <div>
                          {hasVoted && <span className="voted">✓ Voted</span>}
                          <button
                            onClick={() => handleVote(cand.candidateId)}
                            disabled={!isActive || hasVoted || loading}
                            className="btn-vote"
                          >
                            Vote
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="add-candidate">
              <button
                onClick={() => setShowAddCandidateModal(true)}
                disabled={getPollStatus(Number(selectedPoll.startTime), Number(selectedPoll.endTime)) !== 'active' || loading}
                className="btn-primary"
              >
                Add Candidate
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <CreatePollModal
        show={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
        onSubmit={handleCreatePoll}
        loading={loading}
      />

      <AddCandidateModal
        show={showAddCandidateModal}
        onClose={() => setShowAddCandidateModal(false)}
        onSubmit={handleAddCandidate}
        loading={loading}
      />
    </div>
  );
}
