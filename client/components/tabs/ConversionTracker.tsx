'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  getTrackerEntries, addTrackerEntry, deleteTrackerEntry,
  getImportantDMs, addImportantDM, deleteImportantDM,
  getTrackerFeedback,
} from '@/lib/api';
import type { ConversionEntry, ImportantDM } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const INPUT = 'input-base py-2 text-sm';

export default function ConversionTracker() {
  const { profile } = useApp();
  const [entries, setEntries] = useState<ConversionEntry[]>([]);
  const [summary, setSummary] = useState({ totalImpressions: 0, totalDMs: 0, avgConversion: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [impressions, setImpressions] = useState('');
  const [dms, setDms] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [importantDMs, setImportantDMs] = useState<ImportantDM[]>([]);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [newDM, setNewDM] = useState({ name: '', title: '', notes: '' });
  const [addingDM, setAddingDM] = useState(false);
  const [showDMForm, setShowDMForm] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => { loadEntries(); loadImportantDMs(); }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await getTrackerEntries();
      setEntries(data.entries);
      setSummary(data.summary);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 'Failed to load');
    } finally { setLoading(false); }
  }

  async function loadImportantDMs() {
    setDmsLoading(true);
    try { setImportantDMs(await getImportantDMs()); }
    catch { /* noop */ }
    finally { setDmsLoading(false); }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !impressions) return;
    setFormLoading(true);
    try {
      await addTrackerEntry({ date, impressions: parseInt(impressions), dms: parseInt(dms || '0'), notes });
      setImpressions(''); setDms(''); setNotes('');
      loadEntries();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to add entry');
    } finally { setFormLoading(false); }
  }

  async function handleAddDM(e: React.FormEvent) {
    e.preventDefault();
    if (!newDM.name) return;
    setAddingDM(true);
    try {
      await addImportantDM(newDM);
      setNewDM({ name: '', title: '', notes: '' });
      setShowDMForm(false);
      loadImportantDMs();
    } catch { /* noop */ }
    finally { setAddingDM(false); }
  }

  async function handleAIFeedback() {
    setFeedbackLoading(true);
    setFeedback('');
    try {
      const { analysis } = await getTrackerFeedback({ entries, summary }, profile || {});
      setFeedback(analysis);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 'AI feedback failed');
    } finally { setFeedbackLoading(false); }
  }

  const chartEntries = [...entries].reverse().slice(-30);
  const chartData = {
    labels: chartEntries.map(e => e.date.slice(5)),
    datasets: [{
      label: 'Conversion Rate %',
      data: chartEntries.map(e => e.conversion_rate),
      borderColor: 'var(--color-primary)',
      backgroundColor: 'rgba(94, 103, 235, 0.11)',
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: 'var(--color-primary)',
    }],
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
    scales: {
      x: { grid: { color: 'rgba(39, 39, 42, 0.55)' }, ticks: { color: '#a1a1aa', font: { size: 10 } } },
      y: { grid: { color: 'rgba(39, 39, 42, 0.55)' }, ticks: { color: '#a1a1aa', font: { size: 10 } } },
    },
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/75">Measurement</p>
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-base">Conversion tracker</h2>
        <p className="text-sm text-text-muted">Log daily impressions and inbound DMs to watch conversion trends.</p>
      </header>

      {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: 'Impressions', value: summary.totalImpressions.toLocaleString(), Icon: IconEye },
          { label: 'DMs', value: summary.totalDMs.toLocaleString(), Icon: IconChat },
          { label: 'Avg conversion', value: `${summary.avgConversion}%`, Icon: IconTrend },
          { label: 'Days tracked', value: entries.length.toString(), Icon: IconCalendar },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border-base bg-bg-card p-4 shadow-card transition-all duration-300 hover:border-accent/20 hover:shadow-float"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-border-base bg-bg-input text-accent">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="font-heading text-2xl font-semibold tracking-tight text-text-base">{value}</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {entries.length >= 2 && (
          <div className="rounded-2xl border border-border-base bg-bg-card p-6 shadow-card lg:col-span-2">
            <p className="mb-5 text-sm font-semibold text-text-base">Conversion rate (last 30 days)</p>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
        <Card title="Log Daily Data" className={entries.length >= 2 ? '' : 'lg:col-span-3'}>
          <form onSubmit={handleAddEntry} className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">Impressions *</label>
                <input type="number" value={impressions} onChange={e => setImpressions(e.target.value)} placeholder="5000" className={INPUT} min="0" required />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">DMs</label>
                <input type="number" value={dms} onChange={e => setDms(e.target.value)} placeholder="12" className={INPUT} min="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations…" className={INPUT} />
            </div>
            <Button type="submit" variant="primary" loading={formLoading} disabled={!impressions}>
              {formLoading ? 'Saving…' : 'Log entry'}
            </Button>
          </form>
        </Card>
      </div>

      {/* History Table */}
      {entries.length > 0 && (
        <Card title="Analytics History">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-base">
                  {['Date','Impressions','DMs','Conv. Rate','Notes',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-border-base/40 hover:bg-bg-input/30 transition-colors">
                    <td className="px-3 py-2.5 text-text-base font-medium">{e.date}</td>
                    <td className="px-3 py-2.5 text-text-muted">{e.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text-muted">{e.dms}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-semibold ${e.conversion_rate >= 1 ? 'text-green-400' : e.conversion_rate >= 0.3 ? 'text-yellow-400' : 'text-text-muted'}`}>
                        {e.conversion_rate}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-text-muted text-xs max-w-[140px] truncate">{e.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => { deleteTrackerEntry(e.id); loadEntries(); }}
                        className="text-text-muted/40 hover:text-red-400 transition-colors text-sm">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-border-base">
            <Button variant="secondary" loading={feedbackLoading} onClick={handleAIFeedback}>
              {feedbackLoading ? '🤖 Analysing…' : '🤖 Get AI Feedback'}
            </Button>
          </div>
          {feedback && (
            <div className="mt-4 animate-slide-up">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">AI Analysis</p>
              <div className="bg-bg-input border border-border-base rounded-lg p-4 prose-dark text-sm leading-relaxed whitespace-pre-wrap">{feedback}</div>
            </div>
          )}
        </Card>
      )}

      {loading && <div className="text-center py-8 text-text-muted text-sm">Loading data…</div>}

      {/* Important DMs */}
      <Card
        title="VIP contacts"
        action={<Button variant="ghost" size="sm" onClick={() => setShowDMForm(v => !v)}>{showDMForm ? 'Cancel' : '+ Add'}</Button>}
      >
        {showDMForm && (
          <form onSubmit={handleAddDM} className="mb-5 p-4 bg-bg-input border border-border-base rounded-xl space-y-3 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">Name *</label>
                <input type="text" value={newDM.name} onChange={e => setNewDM(d => ({ ...d, name: e.target.value }))}
                  placeholder="John Smith" className={INPUT} required />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">Title / Role</label>
                <input type="text" value={newDM.title} onChange={e => setNewDM(d => ({ ...d, title: e.target.value }))}
                  placeholder="CEO at Acme" className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Notes</label>
              <input type="text" value={newDM.notes} onChange={e => setNewDM(d => ({ ...d, notes: e.target.value }))}
                placeholder="What did they inquire about?" className={INPUT} />
            </div>
            <Button type="submit" variant="primary" loading={addingDM} disabled={!newDM.name} size="sm">Save</Button>
          </form>
        )}
        {dmsLoading ? (
          <p className="text-text-muted text-sm py-4 text-center">Loading…</p>
        ) : importantDMs.length === 0 ? (
          <div className="py-10 text-center text-text-muted">
            <p className="text-sm leading-relaxed">No contacts yet. Pin executives or warm leads you want to follow up with.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {importantDMs.map(dm => (
              <div key={dm.id} className="flex items-start gap-3 p-3 rounded-lg border border-border-base bg-bg-input/30 hover:bg-bg-input/60 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white ring-2 ring-bg-card">
                  {dm.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-base text-sm">{dm.name}</p>
                  {dm.title && <p className="text-xs text-accent">{dm.title}</p>}
                  {dm.notes && <p className="text-xs text-text-muted mt-0.5">{dm.notes}</p>}
                  <p className="text-xs text-text-muted/50 mt-1">{dm.created_at?.slice(0, 10)}</p>
                </div>
                <button onClick={() => { deleteImportantDM(dm.id); loadImportantDMs(); }}
                  className="text-text-muted/40 hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconTrend({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
