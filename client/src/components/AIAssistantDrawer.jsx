import React, { useState } from 'react';
import { Sparkles, X, Wand2, MessageSquare, Users, Check, Copy, ArrowRight } from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ENGINE_LABEL = {
  //ollama: 'Written by ',
  gemini: 'Written by Gemini',
  templates: 'Basic tidy-up (no AI model answered)',
};

export default function AIAssistantDrawer({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [activeTool, setActiveTool] = useState('pitch'); // 'pitch' | 'bio' | 'team'
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRunTool = async () => {
    if (!inputContent.trim() && activeTool !== 'bio') return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      if (activeTool === 'pitch') {
        const res = await aiAPI.rewritePitch({ content: inputContent, targetType: 'project' });
        if (res.data?.success) setResult(res.data.result);
      } else if (activeTool === 'bio') {
        const res = await aiAPI.improveBio({
          headline: user?.headline || inputContent,
          bio: user?.bio || inputContent,
          skills: user?.skills || [],
        });
        if (res.data?.success) setResult(res.data.result);
      }
    } catch (err) {
      console.error(err);
      setError('The AI helper could not respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-900 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                AI Writing Helper
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Improve your bio and project pitch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs">
          <button
            onClick={() => {
              setActiveTool('pitch');
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTool === 'pitch'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Pitch Helper
          </button>
          <button
            onClick={() => {
              setActiveTool('bio');
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTool === 'bio'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Bio Helper
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTool === 'pitch' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Your draft pitch or post:
              </label>
              <textarea
                rows={5}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Paste your rough idea or draft here to polish it..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={handleRunTool}
                disabled={loading || !inputContent.trim()}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" /> Working on it...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Improve Pitch
                  </>
                )}
              </button>
            </div>
          )}

          {activeTool === 'bio' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-300">Your current profile:</p>
                <p>Headline: <span className="font-medium text-slate-900 dark:text-slate-100">{user?.headline || 'Not set'}</span></p>
                <p>Skills: <span className="font-medium text-slate-900 dark:text-slate-100">{user?.skills?.join(', ') || 'No skills added'}</span></p>
              </div>

              <button
                onClick={handleRunTool}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" /> Working on it...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Write My Bio
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3">
              {error}
            </p>
          )}

          {/* AI Results Presentation */}
          {result && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Suggestion
                  {result.engine && (
                    <span className="ml-1 text-[10px] font-semibold normal-case tracking-normal text-slate-400">
                      {ENGINE_LABEL[result.engine] || ''}
                    </span>
                  )}
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      result.enhancedPitch ||
                        `${result.enhancedHeadline}\n\n${result.enhancedBio}`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>

              {result.enhancedPitch && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {result.enhancedPitch}
                </div>
              )}

              {result.enhancedHeadline && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Suggested Headline:</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{result.enhancedHeadline}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Suggested Bio:</p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.enhancedBio}</p>
                  </div>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 text-xs space-y-1.5">
                  <p className="font-bold text-blue-800 dark:text-blue-300">Tips:</p>
                  <ul className="list-disc list-inside text-blue-900 dark:text-blue-200 text-[11px] space-y-1">
                    {result.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
