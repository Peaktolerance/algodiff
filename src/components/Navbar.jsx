import React from 'react';
import { GitCommit, ShieldCheck, Wallet, LogOut, Cpu, Layers, RefreshCw } from 'lucide-react';

export default function Navbar({ wallet, onConnectWallet, onDisconnectWallet, activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('register')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <GitCommit className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">AlgoDiff</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              Algorand TestNet
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Verifiable Git Contributions on Blockchain</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'register'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Diff & Register
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'verify'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          2. Verify Proof
        </button>

        <button
          onClick={() => setActiveTab('tamper')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'tamper'
              ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md font-bold'
              : 'text-amber-400 hover:text-amber-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-400" />
          3. Tamper Demo
        </button>
      </nav>

      {/* Wallet Action Control */}
      <div className="flex items-center gap-3">
        {wallet && wallet.address ? (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left">
              <div className="font-mono text-slate-200 font-semibold">
                {(() => {
                  const addrStr = String(wallet.address);
                  return addrStr.length > 10 ? `${addrStr.substring(0, 6)}...${addrStr.substring(addrStr.length - 4)}` : addrStr;
                })()}
              </div>
              <div className="text-[10px] text-emerald-400">{wallet.balance} ALGO (TestNet)</div>
            </div>
            <button 
              onClick={onDisconnectWallet}
              title="Disconnect Pera Wallet"
              className="p-1.5 hover:bg-rose-950/60 rounded text-slate-400 hover:text-rose-400 transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onConnectWallet}
            className="glow-btn-algo flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg"
          >
            <Wallet className="w-4 h-4 text-cyan-300" />
            Connect Pera Wallet
          </button>
        )}
      </div>
    </header>
  );
}
