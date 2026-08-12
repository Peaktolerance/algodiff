import React from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldAlert, Key } from 'lucide-react';

export default function X402Modal({ isOpen, onClose, paymentState, onProceedToRegistration }) {
  if (!isOpen) return null;

  const { step, title, status, details, paymentSpec, receipt } = paymentState || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-glow max-w-lg w-full p-6 text-slate-200 shadow-2xl relative border border-cyan-500/40">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                HTTP x402 Protocol Flow
                <span className="text-[10px] bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 px-2 py-0.5 rounded">
                  Algorand TestNet
                </span>
              </h3>
              <p className="text-xs text-slate-400">Decentralized HTTP 402 Pay-Per-Use Access Layer</p>
            </div>
          </div>
        </div>

        {/* Step Progress Visualizer */}
        <div className="space-y-4 mb-6">
          
          {/* Step 1: Initial Request */}
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            step >= 1 ? 'bg-slate-900 border-cyan-500/40 text-slate-200' : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            <span className="font-mono">1. POST /api/x402/register-quote</span>
            {step === 1 ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : step > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : null}
          </div>

          {/* Step 2: HTTP 402 Received */}
          <div className={`p-3.5 rounded-lg border text-xs ${
            step === 2
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : step > 2
              ? 'bg-slate-900 border-slate-800 text-slate-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between font-mono font-bold mb-1">
              <span className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                HTTP 402 Payment Required
              </span>
              <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                0.001 ALGO Service Fee
              </span>
            </div>
            {paymentSpec && (
              <div className="font-mono text-[11px] text-slate-400 mt-2 space-y-1 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                <div className="text-amber-300 font-semibold">• x402 Service Fee: 0.001 ALGO (1000 microAlgos)</div>
                <div className="text-cyan-300 font-semibold">• Algorand Network Tx Fee: ~0.001 ALGO</div>
                <div className="text-slate-400 pt-1">Pay To: <span className="text-cyan-400">{paymentSpec.payTo?.substring(0, 14)}...</span></div>
                <div className="text-slate-400">Challenge Nonce: <span className="text-emerald-400">{paymentSpec.challengeNonce?.substring(0, 16)}...</span></div>
              </div>
            )}
          </div>

          {/* Step 3: Wallet Signing */}
          <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            step === 3
              ? 'bg-blue-950/50 border-blue-500/50 text-blue-200'
              : step > 3
              ? 'bg-slate-900 border-slate-800 text-slate-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center gap-2 font-mono">
              <Key className="w-4 h-4 text-blue-400" />
              <span>3. Wallet Payment Signature</span>
            </div>
            {step === 3 && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
            {step > 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>

          {/* Step 4 & 5: Verified HTTP 200 OK */}
          <div className={`p-3.5 rounded-lg border text-xs ${
            status === 'SUCCESS'
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between font-mono font-bold">
              <span className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                4. HTTP 200 OK (Payment Verified)
              </span>
              {receipt && <span className="text-[10px] text-emerald-300 font-mono">SETTLED</span>}
            </div>
            {receipt && (
              <p className="font-mono text-[11px] text-emerald-400/90 mt-2 bg-emerald-950/80 p-2 rounded border border-emerald-500/30">
                ✓ Receipt Token: {receipt.receiptToken}
              </p>
            )}
          </div>
        </div>

        {/* Details & Status message */}
        <p className="text-xs text-slate-400 font-mono mb-6 bg-slate-900/60 p-2.5 rounded border border-slate-800">
          Status: {details || 'Processing x402 payment requirements...'}
        </p>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          {status === 'SUCCESS' ? (
            <button
              onClick={onProceedToRegistration}
              className="glow-btn-algo px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              Proceed to Smart Contract Registration
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
