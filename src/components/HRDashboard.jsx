import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Activity, Brain, FileText, CheckCircle2, AlertTriangle, Clock, Target, EyeOff } from 'lucide-react';

export default function HRDashboard2({ baseline, violations, liveEmotions }) {
  const [showReport, setShowReport] = useState(false);
  const videoRef = useRef(null); // مرجع لعنصر الفيديو

  // تفعيل الكاميرا عند تحميل الصفحة
  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
      }
    }
    enableCamera();

    // تنظيف البث عند إغلاق الصفحة
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const integrityScore = Math.max(0, 100 - (violations.length * 10));
  const currentEmotion = liveEmotions.length > 0 ? liveEmotions[liveEmotions.length - 1] : null;
  const isStressed = currentEmotion && currentEmotion.stressLevel > 6;

  return (
    <div className="h-screen bg-[#0f172a] p-6 text-white overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">HR Insights Dashboard</h1>
          <p className="text-text-secondary text-sm flex items-center mt-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-2"></span>
            Real-time AI Interview Analysis
          </p>
        </div>
        <button onClick={() => setShowReport(true)} className="glass-button flex items-center space-x-2 bg-accent/20 hover:bg-accent/30 border-accent/30">
          <FileText className="w-4 h-4" />
          <span>Generate Agent 5 Report</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column */}
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="glass-panel p-5 flex-1 relative overflow-hidden">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Agent 2: Baseline</h3>
            </div>
            {baseline ? (
              <div className="space-y-4">
                <div className="bg-surface p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-text-secondary mb-1">Psychological State</div>
                  <div className={`text-lg font-bold ${baseline.state === 'Anxious' ? 'text-warning' : 'text-success'}`}>{baseline.state}</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-text-secondary mb-1">Readiness Score</div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-white leading-none">{baseline.readinessScore}</span>
                    <span className="text-sm text-text-secondary ml-1 mb-1">/ 10</span>
                  </div>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                  <p className="text-sm text-primary/90 leading-relaxed">{baseline.hrIcebreakerTip}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary space-y-3">
                <Clock className="w-8 h-8 opacity-50" />
                <p className="text-sm text-center">Waiting for Pre-Interview Session...</p>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Agent 4: Integrity</h3>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${integrityScore > 80 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                {integrityScore}%
              </div>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {violations.length === 0 ? (
                <div className="text-center py-6 text-success/70"><CheckCircle2 className="w-6 h-6 mx-auto mb-2" /> No violations</div>
              ) : (
                violations.map((v, i) => (
                  <div key={i} className="bg-danger/10 border border-danger/20 rounded-lg p-3 flex items-start space-x-3">
                    <EyeOff className="w-4 h-4 text-danger mt-0.5" />
                    <div className="text-xs text-danger/70">{new Date(v.timestamp).toLocaleTimeString()} - Focus Lost</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Live View (The Fixed Part) */}
        <div className="col-span-6 glass-panel p-5 flex flex-col relative">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-warning" />
            <h3 className="font-semibold">Agent 3: Live Emotion Translator</h3>
          </div>

          <div className="flex-1 bg-black rounded-xl border border-white/5 relative overflow-hidden flex flex-col shadow-inner">
            {/* Real Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // مرآة لتسهيل العرض
            />

            {/* Overlay graphics */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center space-x-2 z-10">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-xs font-medium font-mono text-white">LIVE FEED</span>
            </div>

            {/* Live Emotion Ticker */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <AnimatePresence mode="popLayout">
                {isStressed && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-warning/20 border-l-4 border-warning backdrop-blur-md p-4 rounded-r-xl shadow-lg mb-4">
                    <div className="flex items-start space-x-3 text-warning">
                      <AlertTriangle className="w-5 h-5" />
                      <div className="text-sm font-bold">Stress Nudge Triggered</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {currentEmotion && (
                <div className="bg-surface/80 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Current State</div>
                    <div className="text-xl font-bold">{currentEmotion.emotion}</div>
                  </div>
                  <div className="text-right flex space-x-1">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`w-2 h-6 rounded-sm ${i < currentEmotion.stressLevel ? (i > 6 ? 'bg-warning' : 'bg-primary') : 'bg-surface-hover'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-3 glass-panel p-5 flex flex-col">
          <h3 className="font-semibold mb-4 text-text-secondary">System Logs</h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {[...liveEmotions].reverse().map((log, i) => (
              <div key={i} className="text-xs p-3 rounded-lg bg-surface/50 border border-white/5">
                <span className="text-text-secondary">{new Date(log.timestamp).toLocaleTimeString()}</span> - {log.emotion}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Report Modal Logic remains the same... */}
    </div>
  );
}