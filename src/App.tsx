/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { Download, GraduationCap, Calendar, User, Search, AlertCircle, CheckCircle2, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CertificateData {
  name: string;
  pdfLink: string;
}

export default function App() {
  const [usn, setUsn] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [configNeeded, setConfigNeeded] = useState(false);
  
  // CAPTCHA State
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = useCallback(() => {
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1
    });
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // CAPTCHA Validation
    if (parseInt(captchaInput) !== captcha.num1 + captcha.num2) {
      setError('Anti-bot check failed. Try the math again.');
      generateCaptcha();
      return;
    }

    // Client-side validation for USN
    const usnRegex = /^[1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/i;
    // Note: The specific regex depends on the university, but using the suggested example format.
    // Making it case-insensitive for better UX.

    setLoading(true);
    setError(null);
    setCertificate(null);
    setConfigNeeded(false);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usn: usn.trim(), dob }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Specific handling for common status codes
        if (response.status === 404) {
          throw new Error('Check your details. No record matches that USN and DOB combo.');
        } else if (response.status === 400) {
          throw new Error('Incomplete data. Please fill all fields correctly.');
        } else if (response.status === 500) {
          throw new Error('The server is having a moment. Try again in a few seconds.');
        }
        throw new Error(data.error || 'Identity check failed. Please double-check your inputs.');
      }

      if (data.configNeeded) {
        setConfigNeeded(true);
        setError(data.error);
      } else {
        setCertificate(data);
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network outage. Are you connected to the internet?');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      generateCaptcha();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">CertifyU</span>
          </div>
          <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            <span className="text-black transition-colors hover:text-black cursor-pointer">Verify</span>
            <span className="hover:text-black cursor-pointer transition-colors">API</span>
            <div className="h-3 w-px bg-neutral-200" />
            <span className="hover:text-black cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[9px] font-black uppercase tracking-wider text-neutral-500 mb-2"
            >
              <div className="w-1 h-1 rounded-full bg-neutral-400 animate-pulse" />
              Real-time validation
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-extrabold tracking-[-0.04em] text-neutral-950"
            >
              Verify Instantly.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-[13px] text-neutral-400 font-medium px-6 leading-relaxed"
            >
              The definitive portal for your hackathon wins, workshop certs, and event participations.
            </motion.p>
          </div>

          {/* Form Card */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)]"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="usn" className="text-[9px] font-black uppercase tracking-[0.1em] text-neutral-400 ml-0.5">
                  Identification (USN/ID)
                </label>
                <div className="relative group">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors pointer-events-none" />
                  <input
                    id="usn"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="e.g. 1RV17CS001"
                    className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2.5 text-[14px] focus:outline-none focus:border-black focus:ring-[3px] focus:ring-black/5 transition-all placeholder:text-neutral-300 font-medium disabled:opacity-50"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dob" className="text-[9px] font-black uppercase tracking-[0.1em] text-neutral-400 ml-0.5">
                  Date of Birth
                </label>
                <div className="relative group">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors pointer-events-none" />
                  <input
                    id="dob"
                    type="date"
                    required
                    disabled={loading}
                    className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2.5 text-[14px] focus:outline-none focus:border-black focus:ring-[3px] focus:ring-black/5 transition-all font-medium disabled:opacity-50"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              {/* CAPTCHA Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="captcha" className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
                    Human Verification
                  </label>
                  <span className="text-[9px] font-bold text-neutral-300">Solve to continue</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-neutral-50 border border-neutral-100 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-neutral-900 tracking-tighter">
                    <span className="opacity-40 mr-1">MATH CHECK:</span> {captcha.num1} + {captcha.num2}
                  </div>
                  <input
                    id="captcha"
                    type="number"
                    required
                    disabled={loading}
                    placeholder="="
                    className="w-20 h-10 bg-white border border-neutral-200 rounded-lg px-3 text-[14px] text-center focus:outline-none focus:border-black focus:ring-[3px] focus:ring-black/5 transition-all font-bold placeholder:text-neutral-200 disabled:opacity-50"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden w-full h-10 bg-neutral-950 text-white rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-sm"
              >
                <span className={`flex items-center gap-2 transition-all duration-300 ${loading ? 'opacity-0 blur-sm translate-y-2' : 'opacity-100 translate-y-0'}`}>
                  <span>Verify Credentials</span>
                  <ArrowRight size={14} />
                </span>
                
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </div>
                )}
                
                {loading && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-white/20"
                  />
                )}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 pt-8 border-t border-neutral-100 space-y-4"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-2 w-full">
                      <div className="h-2 w-16 bg-neutral-100 rounded animate-pulse" />
                      <div className="h-5 w-[60%] bg-neutral-100 rounded animate-pulse" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 animate-pulse" />
                  </div>
                  <div className="w-full h-14 bg-neutral-50 rounded-xl border border-neutral-100 animate-pulse" />
                </motion.div>
              )}

              {!loading && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 border-t border-neutral-100 pt-6"
                >
                  <div className={`p-3.5 rounded-lg text-xs font-semibold border flex gap-2.5 ${
                    configNeeded ? "bg-amber-50/40 border-amber-100 text-amber-900" : "bg-red-50/40 border-red-100 text-red-900"
                  }`}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{configNeeded ? "Database Setup" : "Record Error"}</p>
                      <p className="opacity-70 mt-0.5 leading-tight">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!loading && certificate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 pt-8 border-t border-neutral-100 space-y-5"
                >
                  {/* Digital Preview */}
                  <div className="relative group cursor-default">
                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-neutral-100 to-neutral-50 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative aspect-[16/10] bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(#f0f0f0_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />
                      
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-18 bg-white border border-neutral-100 rounded shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                          <GraduationCap className="w-7 h-7 text-neutral-100" />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">Digital Preview</p>
                          <p className="text-[8px] font-bold text-neutral-300 mt-0.5">CertifyU Verified</p>
                        </div>
                      </div>

                      {/* Vercel-style Badge */}
                      <div className="absolute top-3 right-3">
                        <div className="bg-black text-[7px] font-black text-white px-1.5 py-0.5 rounded tracking-widest uppercase">
                          Official
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-0.5">Verified Recipient</p>
                      <h3 className="text-base font-bold tracking-tight text-neutral-900">{certificate.name}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>

                  <a
                    href={certificate.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full bg-neutral-950 hover:bg-neutral-800 text-white border border-neutral-950 rounded-lg p-3 transition-all hover:shadow-lg group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center">
                        <Download size={13} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[10px] uppercase tracking-wider">Download Certificate</p>
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight">Verified PDF Document</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-neutral-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Info */}
          <div className="flex items-center justify-center gap-6 text-[8px] font-black uppercase tracking-[0.15em] text-neutral-300">
            <div className="flex items-center gap-1.5 grayscale opacity-50">
              <Download size={9} />
              <span>G-Drive Secured</span>
            </div>
            <div className="flex items-center gap-1.5 grayscale opacity-50">
              <AlertCircle size={9} />
              <span>Data Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white py-8 px-6 shrink-0 mt-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-neutral-50 border border-neutral-100 rounded flex items-center justify-center">
                  <GraduationCap className="w-3 h-3 text-neutral-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">CertifyU</span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-neutral-100 bg-neutral-50/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Service Operational</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                Crafted by
              </div>
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 border-dashed px-3 py-1.5 rounded-full hover:border-neutral-900 transition-colors group cursor-default">
                <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white font-black group-hover:scale-110 transition-transform">R</div>
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-900">Rahul</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-neutral-50 gap-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-300">
              &copy; {new Date().getFullYear()} CertifyU Technologies.
            </div>
            
            <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-neutral-400">
              {import.meta.env.VITE_WEBSITE_URL && (
                <a 
                  href={import.meta.env.VITE_WEBSITE_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-neutral-50 px-2 py-1 rounded border border-neutral-100 text-neutral-900 flex items-center gap-1 hover:border-neutral-900 transition-colors"
                >
                  <Search size={10} />
                  Visit Website
                </a>
              )}
              <span className="hover:text-black transition-colors cursor-pointer">Security</span>
              <span className="hover:text-black transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-black transition-colors cursor-pointer">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>

  );
}
