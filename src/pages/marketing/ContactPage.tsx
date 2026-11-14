import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useApp();
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [subject, setSubject] = useState('Technical Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !workEmail.trim() || !message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('Inquiry Transmitted', 'Our engineering team will review your message shortly.', 'success');
    }, 1200);
  };

  return (
    <div className="w-full py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Info Col */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-pulse-cyan block mb-2">
                Connect with Engineering
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Get in Touch with BotPulse
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Have questions regarding SDK deployment, custom LSTM model training, or integrating your platform with the BotPulse detection engine?
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5 text-xs font-mono">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-white/5">
                <Mail className="w-4 h-4 text-pulse-cyan shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Engineering Inquiries</div>
                  <div className="text-slate-400 mt-0.5">security@botpulse.io</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-white/5">
                <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Security Vulnerability Reporting</div>
                  <div className="text-slate-400 mt-0.5">security-disclosure@botpulse.io</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-2/60 border border-white/5 text-xs text-slate-400">
              <span className="font-bold text-slate-200 block mb-1">Demonstration Notice:</span>
              This form is a frontend demonstration. Submitted data is simulated and processed directly within your browser session.
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-2xl bg-surface-1 border border-white/10 shadow-2xl">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Message Transmitted</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Thank you, {fullName}. Your inquiry has been received by our security engineering desk.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setMessage('');
                    }}
                    className="mt-4 px-4 py-2 rounded-lg text-xs font-mono bg-surface-2 text-slate-200 border border-white/10 hover:border-white/20"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-2">Send a Direct Message</h3>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Maya Chen"
                        className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1.5">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="maya@company.com"
                        className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1.5">
                        Organization / Domain
                      </label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="company.com"
                        className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1.5">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white outline-none transition-colors"
                      >
                        <option value="Technical Inquiry">Technical Inquiry</option>
                        <option value="SDK Integration">SDK Integration Support</option>
                        <option value="Elvara Demonstration">Elvara Store Demo Question</option>
                        <option value="AI Agent Governance">AI Agent Governance Policy</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1.5">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your security challenge or technical question..."
                      className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white placeholder-slate-500 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void shadow-md shadow-pulse-cyan/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Transmitting Telemetry...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
