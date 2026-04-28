import { X, Shield, Lock, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type InfoSection = 'security' | 'privacy' | 'guide';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: InfoSection;
}

export default function InfoModal({ isOpen, onClose, section }: InfoModalProps) {
  const content = {
    guide: {
      title: 'How to use CertifyU',
      icon: <HelpCircle className="w-5 h-5" />,
      steps: [
        {
          title: 'Enter Identification',
          desc: 'Input your unique Student ID or USN exactly as it appears in your college records.'
        },
        {
          title: 'Solve Anti-Bot Check',
          desc: 'A simple math problem ensures that requests are made by real students, protecting our bandwidth.'
        },
        {
          title: 'Download Official PDF',
          desc: 'Once verified, you can instantly preview and download your official certificate hosted on secure drives.'
        }
      ]
    },
    security: {
      title: 'Security Infrastructure',
      icon: <Shield className="w-5 h-5 text-emerald-600" />,
      points: [
        {
          title: 'End-to-End Encryption',
          desc: 'All data transmitted between your device and our servers is protected using military-grade TLS 1.3 encryption.'
        },
        {
          title: 'Zero-Trust API Architecture',
          desc: 'Our backend uses an isolated environment to communicate with Google Cloud, ensuring no sensitive credentials ever touch the browser.'
        },
        {
          title: 'Database Lockdown',
          desc: 'Records are stored in a read-only Google Sheet accessible only by the CertifyU system via cryptographically signed requests.'
        },
        {
          title: 'Anti-Brute Force',
          desc: 'Integrated rate limiting and CAPTCHA mechanisms prevent automated scraping and unauthorized access attempts.'
        }
      ]
    },
    privacy: {
      title: 'Privacy Protocol',
      icon: <Lock className="w-5 h-5 text-neutral-900" />,
      points: [
        {
          title: 'Minimal Data Collection',
          desc: 'We only require your ID to fulfill verification. No browsing history or device data is tracked.'
        },
        {
          title: 'Non-Persistent Sessions',
          desc: 'CertifyU does not log or store your verification entries in a permanent database. Once the window is closed, your session data is cleared.'
        },
        {
          title: 'No Third-Party Sharing',
          desc: 'Your data is strictly between you and the institution. We never sell or share student information with advertisers.'
        },
        {
          title: 'The Attendance Loophole',
          desc: 'Our system verifies your ID, not your seat. Even if you spent the entire semester in the cafeteria instead of the lecture hall, your certificate is safe here. We won\'t tell if you don\'t.'
        }
      ]
    }
  };

  const active = content[section];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-[101]"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden">
              <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center">
                    {active.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-neutral-900">
                      {active.title}
                    </h2>
                    <p className="text-[10px] font-bold text-neutral-400 mt-0.5">CertifyU Official Protocol</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                {(active as any).steps ? (
                  (active as any).steps.map((step: any, i: number) => (
                    <div key={`${section}-step-${i}`} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide text-neutral-900">{step.title}</h3>
                        <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-1">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  (active as any).points.map((point: any, i: number) => (
                    <div key={`${section}-point-${i}`} className="flex gap-4">
                      <div className="mt-0.5 text-neutral-900 shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide text-neutral-900">{point.title}</h3>
                        <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-1">
                          {point.desc}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-center">
                <button 
                  onClick={onClose}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors"
                >
                  Close Document
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
