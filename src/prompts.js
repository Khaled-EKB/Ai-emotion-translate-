// src/prompts.js
export const PROMPTS = {
    PRE_INTERVIEW_ANALYSIS: "Act as a Behavioral Psychologist. Analyze the candidate's answers for stress and readiness. Provide a JSON response with keys: {stress_level: 1-100, mood: string, hr_tip: string}",
    LIVE_NUDGE: "Based on this hesitation and speech delay, provide a 1-sentence tip for the HR interviewer.",
    FINAL_REPORT: "Synthesize all session data into a professional HR hiring recommendation report."
};