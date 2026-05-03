import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Video, Eye, Heart, Brain, BrainCircuit, CheckCircle2, AlertTriangle, MonitorX, Play } from 'lucide-react';
import * as faceapi from 'face-api.js';

const QUESTIONS = [
  { id: 'mood', text: "How are you feeling right now?", type: 'text', placeholder: "E.g., I'm feeling a bit nervous but excited..." },
  { id: 'stress', text: "On a scale of 1-10, what is your current stress level?", type: 'slider', min: 1, max: 10 },
  { id: 'sleep', text: "How was your sleep quality last night?", type: 'text', placeholder: "E.g., Slept for 8 hours, feel rested..." },
  { id: 'concern', text: "What is your primary concern today?", type: 'text', placeholder: "E.g., Technical issues, forgetting an answer..." },
  { id: 'readiness', text: "Are you ready to start the interview?", type: 'radio', options: ['Yes', 'Give me a minute'] }
];

export default function CandidateView2({ onBaselineComplete, onViolation, onLiveEmotionUpdate }) {
  const [phase, setPhase] = useState(1);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interviewTime, setInterviewTime] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef(null);

  // 1. تحميل موديلات الذكاء الاصطناعي عند بدء التشغيل
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading face-api models:", err);
      }
    };
    loadModels();
  }, []);

  // 2. تفعيل الكاميرا والتحليل اللحظي للمشاعر
  useEffect(() => {
    let interval;
    if (phase === 2 && isRecording && modelsLoaded) {
      // تشغيل الكاميرا الحقيقية
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        });

      // بدء تحليل المشاعر كل ثانية بدلاً من المحاكاة العشوائية
      interval = setInterval(async () => {
        if (videoRef.current) {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceExpressions();

          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);

            onLiveEmotionUpdate({
              timestamp: Date.now(),
              emotion: dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1),
              stressLevel: expressions.angry > 0.1 || expressions.fearful > 0.1 ? 8 : 3
            });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isRecording, modelsLoaded, onLiveEmotionUpdate]);

  // Focus tracking
  useEffect(() => {
    if (phase !== 2) return;
    const handleBlur = () => onViolation({ timestamp: Date.now(), type: 'tab_switch' });
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [phase, onViolation]);

  // Interview timer
  useEffect(() => {
    if (phase === 2 && isRecording) {
      const timer = setInterval(() => setInterviewTime(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [phase, isRecording]);

  const handleNextQuestion = () => {
    const q = QUESTIONS[currentQuestionIdx];
    const updatedAnswers = { ...answers, [q.id]: currentAnswer };
    setAnswers(updatedAnswers);

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setCurrentAnswer('');
    } else {
      const stressScore = parseInt(updatedAnswers.stress) || 5;
      const state = stressScore > 7 ? 'Anxious' : stressScore > 4 ? 'Calm' : 'Exhausted';
      onBaselineComplete({
        state,
        readinessScore: 10 - Math.floor(stressScore / 2),
        rawAnswers: updatedAnswers,
        hrIcebreakerTip: stressScore > 7 ? "Candidate seems stressed." : "Candidate is calm."
      });
      setPhase(2);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div key="phase1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="glass-panel p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-primary/20 rounded-xl"><BrainCircuit className="text-primary w-8 h-8" /></div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">Pre-Interview Check-in</h2>
                <p className="text-text-secondary text-sm">Agent 1: Supportive Empathy Agent</p>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex justify-between text-xs text-text-secondary mb-2">
                <span>Question {currentQuestionIdx + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(((currentQuestionIdx) / QUESTIONS.length) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-surface-hover rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${((currentQuestionIdx) / QUESTIONS.length) * 100}%` }} />
              </div>
            </div>
            <motion.div key={currentQuestionIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-[200px]">
              <h3 className="text-xl mb-6 font-medium">{QUESTIONS[currentQuestionIdx].text}</h3>
              {QUESTIONS[currentQuestionIdx].type === 'text' && (
                <textarea autoFocus className="w-full bg-surface/50 border border-white/10 rounded-xl p-4 text-white outline-none resize-none" rows={4} value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder={QUESTIONS[currentQuestionIdx].placeholder} />
              )}
              {QUESTIONS[currentQuestionIdx].type === 'slider' && (
                <div className="py-8">
                  <input type="range" min="1" max="10" value={currentAnswer || 5} onChange={(e) => setCurrentAnswer(e.target.value)} className="w-full accent-primary" />
                  <div className="flex justify-between mt-4 text-text-secondary"><span>1 - Low</span><span className="text-xl text-white font-bold">{currentAnswer || 5}</span><span>10 - High</span></div>
                </div>
              )}
              {QUESTIONS[currentQuestionIdx].type === 'radio' && (
                <div className="space-y-3">
                  {QUESTIONS[currentQuestionIdx].options.map(opt => (
                    <button key={opt} onClick={() => setCurrentAnswer(opt)} className={`w-full text-left px-6 py-4 rounded-xl border transition-all ${currentAnswer === opt ? 'bg-primary/20 border-primary text-white' : 'bg-surface/30 border-white/10 text-text-secondary'}`}>{opt}</button>
                  ))}
                </div>
              )}
            </motion.div>
            <div className="mt-8 flex justify-end">
              <button onClick={handleNextQuestion} disabled={!currentAnswer && QUESTIONS[currentQuestionIdx].type !== 'slider'} className="glass-button flex items-center space-x-2 bg-primary/20 hover:bg-primary/30">
                <span>{currentQuestionIdx === QUESTIONS.length - 1 ? 'Start Interview' : 'Next Question'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="phase2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-surface/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2"><span className="w-3 h-3 rounded-full bg-danger animate-pulse"></span><span className="text-sm font-medium">Live Interview Monitoring</span></div>
                <div className="text-text-secondary text-sm font-mono border-l border-white/10 pl-4">{formatTime(interviewTime)}</div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="flex items-center text-success bg-success/10 px-3 py-1 rounded-full border border-success/20"><CheckCircle2 className="w-4 h-4 mr-1" /> Focus Locked</span>
              </div>
            </div>

            <div className="relative aspect-video bg-black/50 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
              {!isRecording ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsRecording(true)}>
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                  <p className="text-text-secondary font-medium">Click to start real-time monitoring</p>
                </div>
              ) : (
                <div className="absolute inset-0">
                  {/* استبدال الـ Placeholder بالفيديو الحقيقي */}
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" style={{ transform: 'scaleX(-1)' }} />

                  <div className="absolute top-6 right-6 flex space-x-2">
                    <div className="p-2 bg-black/50 backdrop-blur rounded-lg"><Video className="w-4 h-4 text-green-400" /></div>
                    <div className="p-2 bg-black/50 backdrop-blur rounded-lg"><Mic className="w-4 h-4" /></div>
                  </div>

                  <div className="absolute bottom-6 left-6">
                    <div className="text-lg font-medium text-white drop-shadow-md">Live AI Analysis</div>
                    <p className="text-xs text-green-400 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-ping"></span> Real-time Biometrics Active</p>
                  </div>

                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/30 blur-sm shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-[scan_3s_ease-in-out_infinite]" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                <MonitorX className="w-8 h-8 text-warning mb-3" />
                <h4 className="font-medium text-white mb-1">Focus Tracking Active</h4>
                <p className="text-xs text-text-secondary">Agent 4 is monitoring tab activity</p>
              </div>
              <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                <Heart className="w-8 h-8 text-danger mb-3" />
                <h4 className="font-medium text-white mb-1">Emotion Translator Active</h4>
                <p className="text-xs text-text-secondary">Agent 3 is detecting micro-expressions</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </div>
  );
}