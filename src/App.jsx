import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import TamperDemoPage from './pages/TamperDemoPage';
import { connectWallet, disconnectWallet, reconnectWalletSession, getAccountBalance } from './services/algorandClient';
import { ShieldCheck, GitCommit, CreditCard, Cpu, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [wallet, setWallet] = useState(null);
  const [verifyInitialId, setVerifyInitialId] = useState('');

  useEffect(() => {
    // Attempt reconnecting existing Pera Wallet session on startup
    const initWalletSession = async () => {
      const activeSession = await reconnectWalletSession();
      if (activeSession) {
        setWallet(activeSession);
      }
    };
    initWalletSession();
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

  const handleNavigateToVerify = (diffId) => {
    setVerifyInitialId(diffId);
    setActiveTab('verify');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Navbar */}
      <Navbar
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-8 container mx-auto">
        {activeTab === 'register' && (
          <RegisterPage
            wallet={wallet}
            onNavigateToVerify={handleNavigateToVerify}
            onRefreshBalance={handleRefreshWalletBalance}
          />
        )}

        {activeTab === 'verify' && (
          <VerifyPage initialDiffId={verifyInitialId} />
        )}

        {activeTab === 'tamper' && (
          <TamperDemoPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4 container mx-auto">
        <div>
          <span className="text-slate-300 font-bold">AlgoDiff</span> — Verifiable Git Contributions on Algorand
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Pera Wallet (TestNet)</span>
          <span>•</span>
          <span>AlgoPy Smart Contract</span>
          <span>•</span>
          <span>HTTP x402 Protocol</span>
        </div>
      </footer>
    </div>
  );
}
