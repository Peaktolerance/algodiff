import React from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldAlert, Key, X } from 'lucide-react';

export default function X402Modal({ isOpen, onClose, paymentState, onProceedToRegistration }) {
  if (!isOpen) return null;

  const { step, title, status, details, paymentSpec, receipt } = paymentState || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                HTTP x402 Protocol Flow
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                  Algorand TestNet
                </span>
              </h3>
              <p className="text-xs text-slate-500">Decentralized HTTP 402 Pay-Per-Use Access Layer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Visualizer */}
        <div className="space-y-3 mb-6">
          
          {/* Step 1: Initial Request */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            step >= 1 ? 'bg-slate-50 border-slate-200 text-slate-800 font-medium' : 'bg-slate-50/50 border-slate-100 text-slate-400'
          }`}>
            <span className="font-mono">1. POST /api/x402/register-quote</span>
            {step === 1 ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : step > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : null}
          </div>

          {/* Step 2: HTTP 402 Received */}
          <div className={`p-3.5 rounded-xl border text-xs transition-colors ${
            step === 2
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : step > 2
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-50/50 border-slate-100 text-slate-400'
          }`}>
            <div className="flex items-center justify-between font-mono font-semibold mb-1">
              <span className="flex items-center gap-2 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                HTTP 402 Payment Required
              </span>
              <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-800 border border-amber-300 font-bold">
                0.001 ALGO Fee
              </span>
            </div>
            {paymentSpec && (
              <div className="font-mono text-[11px] text-slate-600 mt-2 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-amber-800 font-semibold">• Service Fee: 0.001 ALGO (1000 microAlgos)</div>
                <div className="text-indigo-700 font-semibold">• Algorand Tx Fee: ~0.001 ALGO</div>
                <div className="text-slate-500 pt-1">Pay To: <span className="text-slate-800 font-semibold">{paymentSpec.payTo?.substring(0, 14)}...</span></div>
                <div className="text-slate-500">Challenge Nonce: <span className="text-slate-800 font-semibold">{paymentSpec.challengeNonce?.substring(0, 16)}...</span></div>
              </div>
            )}
          </div>

          {/* Step 3: Wallet Signing */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
            step === 3
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
              : step > 3
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-50/50 border-slate-100 text-slate-400'
          }`}>
            <div className="flex items-center gap-2 font-mono font-medium">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>3. Wallet Payment Signature (Pera Wallet)</span>
            </div>
            {step === 3 && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
            {step > 3 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>

          {/* Step 4 & 5: Verified HTTP 200 OK */}
          <div className={`p-3.5 rounded-xl border text-xs transition-colors ${
            status === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50/50 border-slate-100 text-slate-400'
          }`}>
            <div className="flex items-center justify-between font-mono font-semibold">
              <span className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                4. HTTP 200 OK (Payment Verified)
              </span>
              {receipt && <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded">SETTLED</span>}
            </div>
            {receipt && (
              <p className="font-mono text-[11px] text-emerald-800 mt-2 bg-white p-2 rounded-lg border border-emerald-200">
                ✓ Receipt Token: <span className="font-bold">{receipt.receiptToken}</span>
              </p>
            )}
          </div>
        </div>

        {/* Details & Status message */}
        <p className="text-xs text-slate-600 font-mono mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
          Status: <span className="font-medium text-slate-800">{details || 'Processing x402 payment requirements...'}</span>
        </p>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          {status === 'SUCCESS' ? (
            <button
              onClick={onProceedToRegistration}
              className="btn-algo px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2"
            >
              Proceed to Algorand Registration
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2 rounded-xl text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
