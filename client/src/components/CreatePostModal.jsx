import React, { useState, useRef } from 'react';
import { X, Send, Sparkles, Image, Wand2, PenTool, MessageSquare, Lightbulb, Rocket, Calendar, Briefcase } from 'lucide-react';
import { postAPI, aiAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreatePostModal({ isOpen, onClose, onCreated, defaultCommunityId }) {
  const toast = useToast();
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiPolishing, setAiPolishing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAIPolish = async () => {
    if (!content.trim()) return;
    setAiPolishing(true);
    try {
      const res = await aiAPI.rewritePitch({ content, targetType: type });
      if (res.data?.success && res.data.result) {
        setContent(res.data.result.enhancedPitch || content);
        if (res.data.result.suggestedTags?.length > 0) {
          const newTags = res.data.result.suggestedTags.join(', ');
          setTags((prev) => (prev ? `${prev}, ${newTags}` : newTags));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiPolishing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('type', type);
      formData.append('tags', tags);
      if (defaultCommunityId) formData.append('community', defaultCommunityId);
      if (imageFile) formData.append('image', imageFile);

      const res = await postAPI.create(formData);

      if (res.data.success) {
        setContent('');
        setTags('');
        setType('general');
        setImageFile(null);
        setImagePreview(null);
        onClose();
        if (onCreated) onCreated(res.data.post);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish your post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-sm"></div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Post</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Category / Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'general', label: <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> General</span> },
                { id: 'idea', label: <span className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> Idea</span> },
                { id: 'project', label: <span className="flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" /> Project</span> },
                { id: 'event', label: <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Event</span> },
                { id: 'opportunity', label: <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Opportunity</span> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                    type === t.id
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                What do you want to share? (Supports #hashtags and @mentions)
              </label>
              {content.trim().length > 10 && (
                <button
                  type="button"
                  onClick={handleAIPolish}
                  disabled={aiPolishing}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiPolishing ? 'Polishing...' : 'AI Polish'}
                </button>
              )}
            </div>
            <textarea
              rows="4"
              required
              placeholder="Share your project progress, idea, or ask for teammates using #tags and @mentions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            ></textarea>
          </div>

          {/* Image Preview if selected */}
          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-40">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tags and Image Upload Row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tags (e.g. React, AI, Startups)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Image className="w-3.5 h-3.5 text-amber-500" />
              <span>Image</span>
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-6 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Posting...' : 'Publish Post'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
