import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, FileText, Send, Link, Copy, Check, AlertCircle, Loader2, Award
} from 'lucide-react';

export const AICopilot: React.FC = () => {
  const { user } = useAuth();
  
  // Input States
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jd, setJD] = useState('');
  const [resume, setResume] = useState(
    user ? `Resume of ${user.name}\nEmail: ${user.email}\n\nTechnical Skills: React, Node.js, Express, JavaScript, TypeScript, Postgres, Git.\nExperience:\n- Software Engineer Intern: Built full-stack features.\n- Projects: Job CRM, Task board app.` : ''
  );
  
  // Mode Selection
  const [activeActionTab, setActiveActionTab] = useState<'match' | 'outreach'>('match');
  const [outreachType, setOutreachType] = useState<'cover_letter' | 'cold_email' | 'linkedin_message'>('cold_email');
  
  // Loading & Result States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [outreachResult, setOutreachResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError('Please provide both the Job Description and your Resume text.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const res = await api.ai.analyzeJD({ jd, resume });
      setAnalysisResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze Job Description.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!jd.trim() || !resume.trim() || !companyName.trim() || !jobTitle.trim()) {
      setError('Please fill in Company, Job Title, JD, and Resume fields.');
      return;
    }
    setLoading(true);
    setError(null);
    setOutreachResult(null);
    try {
      const res = await api.ai.generateOutreach({
        type: outreachType,
        companyName,
        jobTitle,
        jd,
        resume,
        senderName: user?.name || 'Applicant'
      });
      setOutreachResult(res.text);
    } catch (err: any) {
      setError(err.message || 'Failed to generate outreach copy.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outreachResult) return;
    navigator.clipboard.writeText(outreachResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] overflow-hidden select-none p-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-purple-500 fill-purple-500/10" />
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Career Copilot</h1>
          <p className="text-slate-500 text-xs mt-1">Optimize your resume against ATS tracking algorithms and generate cold outreaches using Gemini AI</p>
        </div>
      </div>

      {/* Main Workspace split screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
        {/* Left Column: Input Form */}
        <div className="glass-panel p-6 rounded-xl flex flex-col space-y-4 overflow-y-auto scrollbar-thin">
          <h3 className="font-bold text-sm text-slate-200">Opportunity Specs</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Front-end Engineer"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[150px]">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Job Description</label>
            <textarea
              value={jd}
              onChange={(e) => setJD(e.target.value)}
              placeholder="Paste the target job description requirements here..."
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 resize-none min-h-[120px]"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[150px]">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Your Resume Content</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your plain-text resume achievements and technical skill sections here..."
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 resize-none min-h-[120px]"
            />
          </div>
        </div>

        {/* Right Column: AI Outputs */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
          {/* Action Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/10 px-4">
            <button
              onClick={() => setActiveActionTab('match')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeActionTab === 'match'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              <Award className="h-4 w-4" />
              ATS Score Matcher
            </button>
            
            <button
              onClick={() => setActiveActionTab('outreach')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeActionTab === 'outreach'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              <Send className="h-4 w-4" />
              Outreach Generator
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action body content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-4" />
                <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Running AI pipeline...</span>
              </div>
            ) : activeActionTab === 'match' ? (
              /* TAB 1: ATS SCORE MATCHER */
              analysisResult ? (
                <div className="space-y-6">
                  {/* Score Gauge card */}
                  <div className="p-5 border border-slate-800 rounded-xl bg-slate-900/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimated ATS Match</p>
                      <h4 className="text-3xl font-extrabold text-slate-100 mt-1">{analysisResult.matchScore}%</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Based on keyword matching and project alignments</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-4 border-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 w-full bg-purple-500/20 transition-all"
                        style={{ height: `${analysisResult.matchScore}%` }}
                      ></div>
                      <span>Fit score</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">Match Analysis</h4>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/20 border border-slate-800/40 p-3.5 rounded-lg">
                      {analysisResult.matchSummary}
                    </p>
                  </div>

                  {/* Skills gaps */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">Detected Skill Gaps</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missingSkills.map((sk: string, idx: number) => (
                        <span key={idx} className="bg-red-500/10 border border-red-500/10 text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Improvement suggestions */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">Tailoring Recommendations</h4>
                    <ul className="space-y-2">
                      {analysisResult.improvementSuggestions.map((sug: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-450 leading-normal flex items-start gap-2">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <Award className="h-12 w-12 text-slate-700 mb-3" />
                  <p className="text-xs text-slate-500 max-w-xs leading-normal">
                    Provide the Job Description and your Resume text, then trigger the assessment scan.
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Scan ATS Match
                  </button>
                </div>
              )
            ) : (
              /* TAB 2: OUTREACH GENERATOR */
              <div>
                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[
                    { id: 'cold_email', name: 'Cold Email' },
                    { id: 'cover_letter', name: 'Cover Letter' },
                    { id: 'linkedin_message', name: 'LinkedIn Msg' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setOutreachType(btn.id as any)}
                      className={`py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        outreachType === btn.id
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {btn.name}
                    </button>
                  ))}
                </div>

                {outreachResult ? (
                  <div className="space-y-4">
                    {/* Copy and Actions header */}
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>Generated Copy</span>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 hover:text-slate-350 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy to clipboard</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Result Output */}
                    <div className="w-full bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {outreachResult}
                    </div>

                    <button
                      onClick={handleGenerateOutreach}
                      className="w-full py-2 border border-purple-500/25 hover:bg-purple-500/5 text-purple-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Regenerate outreach
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <Send className="h-12 w-12 text-slate-700 mb-3" />
                    <p className="text-xs text-slate-500 max-w-xs leading-normal">
                      Fill out the company and job specifications, then tap Generate to draft tailored copy.
                    </p>
                    <button
                      onClick={handleGenerateOutreach}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Generate Outreach
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
