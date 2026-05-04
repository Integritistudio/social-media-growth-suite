'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { buildFunnelStrategy } from '@/lib/api';
// buildFunnelStrategy now routes to /api/ai/funnel-strategy (multi-provider)
import { BOTTLENECK_OPTIONS, FREQ_OPTIONS, GOAL_OPTIONS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';

export default function FunnelStrategy() {
  const { profile } = useApp();
  const [bottleneck, setBottleneck] = useState('awareness');
  const [freq, setFreq] = useState('3-4x');
  const [goal, setGoal] = useState('grow-followers');
  const [followers, setFollowers] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleBuild() {
    setLoading(true);
    setError('');
    setStrategy('');
    try {
      const result = await buildFunnelStrategy({
        bottleneck,
        freq,
        goal,
        followers,
        context,
        profile: profile || {},
      });
      setStrategy(result.strategy);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to build strategy';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(strategy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function renderMarkdown(text: string) {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="font-heading font-semibold text-text-base mt-4 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-heading font-bold text-lg text-accent mt-5 mb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="font-heading font-bold text-xl gradient-text mt-5 mb-3">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4 text-text-base text-sm mb-1">
              {line.slice(2)}
            </li>
          );
        }
        if (/^\d+\. /.test(line)) {
          return (
            <li key={i} className="ml-4 text-text-base text-sm mb-1 list-decimal">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-semibold text-text-base text-sm mt-3 mb-1">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return (
          <p key={i} className="text-text-base text-sm mb-1.5">
            {line}
          </p>
        );
      });
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="font-heading font-bold text-2xl">🎯 Funnel Strategy Builder</h2>
        <p className="text-text-muted mt-1">
          Tell the AI about your current situation and get a detailed Instagram growth strategy.
        </p>
      </div>

      {!profile && (
        <Alert variant="warning">
          No business profile set up. Complete the Business Setup tab first for more personalized strategies.
        </Alert>
      )}

      <Card title="Strategy Parameters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bottleneck */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">
              Main Bottleneck
            </label>
            <select
              value={bottleneck}
              onChange={(e) => setBottleneck(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/50 text-sm"
            >
              {BOTTLENECK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-bg-input">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Posting Frequency */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">
              Posting Frequency
            </label>
            <select
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/50 text-sm"
            >
              {FREQ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-bg-input">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">
              Primary Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/50 text-sm"
            >
              {GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-bg-input">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Follower Count */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">
              Current Follower Count
            </label>
            <input
              type="text"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder="e.g. 1200, 50K, 1M"
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
            />
          </div>

          {/* Additional Context */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-base mb-1.5">
              Additional Context{' '}
              <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any other details about your situation, past efforts, budget, team size, etc."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
            />
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border-base">
          <Button variant="primary" loading={loading} onClick={handleBuild} size="lg">
            {loading ? '🤖 Building Strategy...' : '🎯 Build Strategy'}
          </Button>
          {loading && (
            <p className="text-xs text-text-muted mt-2">
              Claude is crafting a personalized strategy for you…
            </p>
          )}
        </div>
      </Card>

      {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

      {strategy && (
        <Card
          title="Your Growth Strategy"
          titleAction={
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </Button>
          }
        >
          <div className="prose-dark max-w-none">{renderMarkdown(strategy)}</div>
        </Card>
      )}
    </div>
  );
}
