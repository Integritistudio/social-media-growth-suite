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

const INPUT = 'w-full px-3 py-2 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/60 text-sm transition-colors';

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
      backgroundColor: 'rgba(124,109,250,.08)',
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: 'var(--color-primary)',
    }],
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
    scales: {
      x: { grid: { color: 'rgba(42,42,58,.5)' }, ticks: { color: '#8888aa', font: { size: 10 } } },
      y: { grid: { color: 'rgba(42,42,58,.5)' }, ticks: { color: '#8888aa', font: { size: 10 } } },
    },
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-base">📊 Conversion Tracker</h2>
        <p className="text-text-muted mt-1 text-sm">Track daily Instagram analytics and conversion rates.</p>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Impressions', value: summary.totalImpressions.toLocaleString(), icon: '👁️' },
          { label: 'Total DMs',         value: summary.totalDMs.toLocaleString(),         icon: '💬' },
          { label: 'Avg Conversion',    value: `${summary.avgConversion}%`,               icon: '📈' },
          { label: 'Days Tracked',      value: entries.length.toString(),                 icon: '📅' },
        ].map(c => (
          <div key={c.label} className="bg-bg-card border border-border-base rounded-xl p-4">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="font-heading font-bold text-xl text-text-base">{c.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {entries.length >= 2 && (
          <div className="lg:col-span-2 bg-bg-card border border-border-base rounded-xl p-5">
            <p className="text-sm font-medium text-text-base mb-4">Conversion Rate Trend (last 30 days)</p>
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
              {formLoading ? 'Saving…' : '+ Log Entry'}
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
        title="⭐ VIP Contacts / CEO DMs"
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
          <div className="text-center py-8 text-text-muted">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-sm">No VIP contacts yet. Track important leads and CEO DMs here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {importantDMs.map(dm => (
              <div key={dm.id} className="flex items-start gap-3 p-3 rounded-lg border border-border-base bg-bg-input/30 hover:bg-bg-input/60 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
