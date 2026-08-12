import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewPage from './pages/OverviewPage';
import RepoWatchPage from './pages/RepoWatchPage';
import RepoDetailPage from './pages/RepoDetailPage';
import ActivityPage from './pages/ActivityPage';
import VerifyPage from './pages/VerifyPage';
import TamperDemoPage from './pages/TamperDemoPage';
import RegisterPage from './pages/RegisterPage';
import AddRepoModal from './components/AddRepoModal';
import X402Modal from './components/X402Modal';
import { getWatchedRepos, addWatchedRepo, removeWatchedRepo, getRecentActivity, checkRepoUpdates, markUpdateVerified } from './services/repoWatchClient';
import { connectWallet, disconnectWallet, reconnectWalletSession, getAccountBalance, registerDiffOnChain, resolveCanonicalAddress } from './services/algorandClient';
import { executeX402Payment } from './services/x402Client';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [wallet, setWallet] = useState(null);
  const [verifyInitialId, setVerifyInitialId] = useState('');
  const [verifyInitialUpdate, setVerifyInitialUpdate] = useState(null);

  // Repo Watch REST API State
  const [repos, setRepos] = useState([]);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({ totalRepos: 0, totalUpdates: 0, verifiedProofs: 0 });
  const [loadingWatchData, setLoadingWatchData] = useState(true);

  // Detail view state
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  // Global Add Repo Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Proof Registration Modal State (from Repo Watch detail view)
  const [isX402ModalOpen, setIsX402ModalOpen] = useState(false);
  const [x402State, setX402State] = useState(null);
  const [activeRegistrationUpdate, setActiveRegistrationUpdate] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // Load backend watched repos and activity data
  const refreshWatchData = async () => {
    try {
      setLoadingWatchData(true);
      const [reposRes, activityRes] = await Promise.all([
        getWatchedRepos(),
        getRecentActivity(50)
      ]);

      if (reposRes?.repos) {
        setRepos(reposRes.repos);
        setStats(reposRes.stats || { totalRepos: reposRes.repos.length, totalUpdates: 0, verifiedProofs: 0 });
      }

      if (activityRes?.activity) {
        setActivity(activityRes.activity);
      }
    } catch (e) {
      console.warn("Failed to load Repo Watch data from backend server:", e.message);
    } finally {
      setLoadingWatchData(false);
    }
  };

  useEffect(() => {
    // 1. Reconnect Pera Wallet session
    const initWalletSession = async () => {
      const activeSession = await reconnectWalletSession();
      if (activeSession) {
        setWallet(activeSession);
      }
    };
    initWalletSession();

    // 2. Fetch Repo Watch data
    refreshWatchData();

    // 3. Set interval to refresh activity feed every 30s
    const timer = setInterval(refreshWatchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleConnectWallet = async () => {
    try {
      const w = await connectWallet();
      if (w) {
        setWallet(w);
      }
    } catch (e) {
      console.error("Pera Wallet connection error:", e);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
      setWallet(null);
    } catch (e) {
      console.error("Disconnect error:", e);
    }
  };

  const handleRefreshWalletBalance = async () => {
    if (wallet?.address) {
      const newBal = await getAccountBalance(wallet.address);
      setWallet((prev) => (prev ? { ...prev, balance: newBal } : prev));
    }
  };

  const handleAddRepo = async (url) => {
    await addWatchedRepo(url);
    await refreshWatchData();
  };

  const handleRemoveRepo = async (repoId) => {
    await removeWatchedRepo(repoId);
    if (selectedRepo?.id === repoId) setSelectedRepo(null);
    await refreshWatchData();
  };

  const handleCheckUpdates = async (repoId) => {
    await checkRepoUpdates(repoId);
    await refreshWatchData();
  };

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setActiveTab('repo-detail');
  };

  const handleSelectUpdate = (updateItem) => {
    const repoObj = repos.find(r => r.id.toLowerCase() === updateItem.repoId.toLowerCase()) || {
      id: updateItem.repoId,
      fullName: updateItem.repoId,
      name: updateItem.repoName || updateItem.repoId,
      description: 'Watched GitHub Repository',
    };
    setSelectedRepo(repoObj);
    setSelectedUpdate(updateItem);
    setActiveTab('repo-detail');
  };

  const handleNavigateToVerify = (target) => {
    if (target && typeof target === 'object') {
      setVerifyInitialUpdate(target);
      setVerifyInitialId(target.diffId || '');
    } else {
      setVerifyInitialUpdate(null);
      setVerifyInitialId(target || '');
    }
    setActiveTab('verify');
  };

  // Trigger Proof Registration for a Repo Watch update item
  const handleRegisterProofFromDetail = async (updateRecord) => {
    setActiveRegistrationUpdate(updateRecord);
    const senderAddress = resolveCanonicalAddress(wallet);

    setIsX402ModalOpen(true);
    setX402State({ step: 1, title: 'Initiating x402 Payment', status: 'pending' });

    try {
      const x402Res = await executeX402Payment({
        diffId: updateRecord.diffId,
        diffHash: updateRecord.diffHash,
        walletAccount: wallet,
        walletAddress: senderAddress,
        onStepChange: (state) => setX402State(state),
      });

      setPaymentSuccessData(x402Res);
      handleRefreshWalletBalance();
    } catch (e) {
      console.error("x402 payment flow exception:", e);
    }
  };

  // Execute Algorand Smart Contract call for Repo Watch update item
  const handleProceedToAlgorandRegistration = async () => {
    if (!activeRegistrationUpdate) return;
    setIsX402ModalOpen(false);

    const resolvedAddress = resolveCanonicalAddress(wallet);

    try {
      const res = await registerDiffOnChain({
        diffId: activeRegistrationUpdate.diffId,
        repoId: activeRegistrationUpdate.repoId,
        fromCommit: activeRegistrationUpdate.fromCommit,
        toCommit: activeRegistrationUpdate.toCommit,
        diffHash: activeRegistrationUpdate.diffHash,
        paymentTxId: paymentSuccessData?.paymentTxId,
        walletAddress: resolvedAddress,
      });

      // Record verification on backend server
      await markUpdateVerified({
        updateId: activeRegistrationUpdate.updateId,
        txId: res.txId,
        confirmedRound: res.confirmedRound,
        submitter: resolvedAddress,
      });

      handleRefreshWalletBalance();
      await refreshWatchData();
    } catch (err) {
      console.error("Smart contract registration error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20">
      
      {/* Top Navigation */}
      <Navbar
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'repo-detail') {
            setSelectedRepo(null);
            setSelectedUpdate(null);
          }
          setActiveTab(tab);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        
        {activeTab === 'overview' && (
          <OverviewPage
            stats={stats}
            activity={activity}
            repos={repos}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onSelectRepo={handleSelectRepo}
            onSelectUpdate={handleSelectUpdate}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'watch' && (
          <RepoWatchPage
            repos={repos}
            onAddRepo={handleAddRepo}
            onRemoveRepo={handleRemoveRepo}
            onCheckUpdates={handleCheckUpdates}
            onSelectRepo={handleSelectRepo}
            onSelectUpdate={handleSelectUpdate}
          />
        )}

        {activeTab === 'repo-detail' && selectedRepo && (
          <RepoDetailPage
            repo={selectedRepo}
            updates={activity.filter(a => a.repoId.toLowerCase() === selectedRepo.id.toLowerCase())}
            onBack={() => setActiveTab('watch')}
            onRegisterProof={handleRegisterProofFromDetail}
            onNavigateToVerify={handleNavigateToVerify}
            wallet={wallet}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityPage
            activity={activity}
            onSelectUpdate={handleSelectUpdate}
            onNavigateToVerify={handleNavigateToVerify}
          />
        )}

        {activeTab === 'verify' && (
          <VerifyPage
            initialDiffId={verifyInitialId}
            initialUpdate={verifyInitialUpdate}
            repos={repos}
            activity={activity}
          />
        )}

        {activeTab === 'tamper' && (
          <TamperDemoPage />
        )}

        {activeTab === 'register' && (
          <RegisterPage
            wallet={wallet}
            onNavigateToVerify={handleNavigateToVerify}
            onRefreshBalance={handleRefreshWalletBalance}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-8 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div>
          <span className="text-slate-900 font-bold">AlgoDiff</span> — Verifiable Repository Intelligence & Change Monitoring
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Pera Wallet (TestNet)</span>
          <span>•</span>
          <span>App ID: 769036041</span>
          <span>•</span>
          <span>x402 Protocol</span>
          <span>•</span>
          <span>SHA-256 Fingerprinting</span>
        </div>
      </footer>

      {/* Global Add Repo Modal */}
      <AddRepoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRepo={handleAddRepo}
      />

      {/* x402 Modal for Repo Watch Detail Registration */}
      <X402Modal
        isOpen={isX402ModalOpen}
        onClose={() => setIsX402ModalOpen(false)}
        paymentState={x402State}
        onProceedToRegistration={handleProceedToAlgorandRegistration}
      />

    </div>
  );
}
