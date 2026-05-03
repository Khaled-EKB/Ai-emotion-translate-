// src/App.jsx
import React, { useState } from 'react';
import { UserCircle, Users } from 'lucide-react';
import { PROMPTS } from './prompts';
import CandidateView from './components/CandidateView';
import HRDashboard from './components/HRDashboard';
import { aiApi } from './services/api';

function App() {
  const [baselineData, setBaselineData] = useState(null);
  const [violations, setViolations] = useState([]);
  const [liveEmotions, setLiveEmotions] = useState([]);
  const [activeView, setActiveView] = useState('candidate');

  // Send pre-interview answers to Java backend for AI analysis (Lingua → Anthropic → DeepL)
  const handleBaselineComplete = async (answers) => {
    try {
      // Convert the raw answers to a readable text block for the AI to analyze
      const textToAnalyze = Object.entries(answers.rawAnswers || answers)
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');

      const result = await aiApi.analyze(textToAnalyze, 'English', 'EN-US');
      setBaselineData({
        state: answers.state || 'Unknown',
        readinessScore: answers.readinessScore || 5,
        hrIcebreakerTip: answers.hrIcebreakerTip || '',
        emotions: result.emotions,
        detectedLanguage: result.detectedLanguage,
        translatedText: result.translatedText,
        historyId: result.historyId,
      });
    } catch (error) {
      console.error("Backend connection failed:", error);
      // Fallback to local baseline if backend is unreachable
      setBaselineData(answers);
    }
  };

  const handleViolation = (violation) => {
    setViolations(prev => [...prev, violation]);
  };

  const handleLiveEmotionUpdate = (update) => {
    setLiveEmotions(prev => [...prev, update]);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Global Navigation - Only for demo purposes to switch views */}
      <nav className="border-b border-white/10 bg-surface/50 backdrop-blur-lg px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold shadow-lg">
            A
          </div>
          <span className="font-bold text-xl tracking-wide">AIET System</span>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveView('candidate')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${activeView === 'candidate' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
          >
            <UserCircle className="w-4 h-4" />
            <span>Candidate Portal</span>
          </button>
          <button
            onClick={() => setActiveView('hr')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${activeView === 'hr' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
          >
            <Users className="w-4 h-4" />
            <span>HR Dashboard</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        {activeView === 'candidate' ? (
          <CandidateView
            onBaselineComplete={handleBaselineComplete}
            onViolation={handleViolation}
            onLiveEmotionUpdate={handleLiveEmotionUpdate}
          />
        ) : (
          <HRDashboard
            baseline={baselineData}
            violations={violations}
            liveEmotions={liveEmotions}
          />
        )}
      </main>
    </div>
  );
}

export default App;
