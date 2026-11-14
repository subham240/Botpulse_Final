import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FileText, Download, Calendar, Filter, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const [reportType, setReportType] = useState('Traffic Classification');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportCategories = [
    { title: 'Traffic Classification Report', desc: 'Comprehensive breakdown of Human vs Bot vs AI-agent request ratios across all paths.' },
    { title: 'Bot Detection & Incident Audit', desc: 'Chronological catalog of automated scraping and credential stuffing events.' },
    { title: 'AI-Agent Activity & Governance', desc: 'Attribution report covering LLM crawler throughput and RAD-S1 confidence scores.' },
    { title: 'Threat Prevention & WAF Enforcement', desc: 'Summary of Edge block, challenge, and rate-limit triggers by ASN and country.' },
    { title: 'Session Behaviour & Entropy Deep-Dive', desc: 'Statistical distributions of pointer entropy, scroll velocity, and flight timings.' },
    { title: 'Model Performance & Latency Benchmark', desc: 'Inference overhead metrics for XGBoost, LSTM, and RAD-S1 neural pipelines.' },
  ];

  const handleDownload = (format: 'PDF' | 'CSV') => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      showToast('Report Generated', `Exported [${reportType}] in ${format} format.`, 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-1 border border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Security Compliance & Forensic Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate executive summaries, regulatory audit logs, and behavioural threat analyses.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-surface-2 px-3 py-1.5 rounded-lg border border-white/5">
          Simulated Export Engine Active
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="p-6 rounded-2xl bg-surface-1 border border-white/5 space-y-6">
        <h3 className="text-sm font-bold text-white font-mono uppercase">
          Select Report Template
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCategories.map((cat) => (
            <div
              key={cat.title}
              onClick={() => setReportType(cat.title)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                reportType === cat.title
                  ? 'bg-surface-2 border-pulse-cyan shadow-md shadow-pulse-cyan/10'
                  : 'bg-surface-0 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className={`w-4 h-4 ${reportType === cat.title ? 'text-pulse-cyan' : 'text-slate-400'}`} />
                <h4 className="text-xs font-bold text-white">{cat.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Date Window:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 text-white outline-none"
            >
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last Quarter">Last Quarter (90 Days)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => handleDownload('PDF')}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg bg-pulse-cyan text-void font-bold hover:opacity-95 shadow-md shadow-pulse-cyan/20 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Executive PDF'}</span>
            </button>
            <button
              onClick={() => handleDownload('CSV')}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg bg-surface-2 text-slate-200 border border-white/10 hover:border-white/20 flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Raw CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
