'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const router  = useRouter();
  const { state } = useStore();

  const [deleting, setDeleting]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/account');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'cardiq-portfolio.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/');
    } catch {
      alert('Failed to delete account. Please try again or contact support.');
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 fade-in-up">
      <div>
        <h1 className="section-accent font-card text-5xl uppercase tracking-widest"><span className="title-gold">Settings</span></h1>
        <p className="text-slate-500 mt-2 text-sm font-sans">
          Manage your account data and preferences.
        </p>
      </div>

      {/* Portfolio stats */}
      <div className="chrome-panel p-6">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-4">
          Your Data
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Cards in portfolio', value: state.cards.length },
            { label: 'Signals generated', value: state.signals.length },
            { label: 'Alerts',            value: state.alerts.length  },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0A1628] border border-[rgba(192,200,216,0.08)] rounded-md px-4 py-3">
              <p className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-600 mb-1">{label}</p>
              <p className="font-card text-2xl text-white tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || state.cards.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#111D33] border border-[rgba(192,200,216,0.14)] text-chrome-300 hover:text-white hover:border-[rgba(192,200,216,0.3)] text-xs font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-40"
          >
            <Download size={12} />
            {exporting ? 'Exporting…' : 'Export Portfolio CSV'}
          </button>
        </div>
        {state.cards.length === 0 && (
          <p className="text-chrome-600 text-xs font-sans mt-3">No cards in your portfolio yet.</p>
        )}
      </div>

      {/* Legal links */}
      <div className="chrome-panel p-6">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-4">Legal</p>
        <div className="space-y-2">
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-md bg-[#0A1628] border border-[rgba(192,200,216,0.08)] text-chrome-400 hover:text-chrome-200 text-sm font-sans transition-colors duration-200 cursor-pointer"
            >
              {label}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="chrome-panel p-6 border border-red-500/15">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-red-400" />
          <p className="text-[10px] font-display font-black uppercase tracking-widest text-red-400">
            Danger Zone
          </p>
        </div>

        {!showDeleteConfirm ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white text-sm font-semibold font-sans">Delete Account</p>
              <p className="text-slate-500 text-xs font-sans mt-1">
                Permanently delete your account and all {state.cards.length > 0 ? `${state.cards.length} card${state.cards.length !== 1 ? 's' : ''}` : 'portfolio data'}. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={13} className="text-red-400" />
                <p className="text-red-300 text-xs font-display font-black uppercase tracking-widest">Confirm deletion</p>
              </div>
              <p className="text-slate-400 text-sm font-sans leading-relaxed">
                This will permanently delete your account, all {state.cards.length} cards, signals, and alerts. Your Clerk account will also be removed.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-2">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-[#111D33] border border-red-500/30 text-white rounded-md px-4 py-3 text-sm focus:outline-none focus:border-red-500/60 transition-all duration-200 placeholder-chrome-700"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                className="flex-1 py-2.5 rounded-md bg-[#111D33] border border-[rgba(192,200,216,0.12)] text-chrome-400 text-[10px] font-display font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer hover:text-chrome-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex-1 py-2.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-[10px] font-display font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={11} />
                {deleting ? 'Deleting…' : 'Delete My Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
