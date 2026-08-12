import React from 'react';
import { GitCommit, Eye, Activity, ShieldCheck, Cpu, Wallet, LogOut, Layers, ExternalLink } from 'lucide-react';

export default function Navbar({ wallet, onConnectWallet, onDisconnectWallet, activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'watch', label: 'Repo Watch', icon: Eye },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'verify', label: 'Verify Proof', icon: ShieldCheck },
    { id: 'tamper', label: 'Tamper Demo', icon: Cpu },
    { id: 'register', label: 'Manual Diff', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('overview')}>
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 font-mono">AlgoDiff</h1>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                Algorand TestNet
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">Verifiable Repository Change Monitoring</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Pera Wallet Action */}
        <div className="flex items-center gap-3">
          {wallet && wallet.address ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <div className="font-mono text-slate-800 font-semibold text-[11px]">
                  {(() => {
                    const addrStr = String(wallet.address);
                    return addrStr.length > 10 ? `${addrStr.substring(0, 6)}...${addrStr.substring(addrStr.length - 4)}` : addrStr;
                  })()}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">{wallet.balance} ALGO</div>
              </div>
              <button 
                onClick={onDisconnectWallet}
                title="Disconnect Pera Wallet"
                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-algo flex items-center gap-2 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Pera Wallet
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
