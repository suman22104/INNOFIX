import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';
import { Settings, Shield, User, Save, Check, Download, Trash2, Eye, MessageSquare, Sun, Moon, Bookmark, HelpCircle, AlertCircle, Palette, ExternalLink } from 'lucide-react';
import SavedPage from './SavedPage';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const toast = useToast();
  const { user, updateUser, logout, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState('privacy');
  const [saved, setSaved] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacy?.profileVisibility || 'public',
    allowMessagesFrom: user?.privacy?.allowMessagesFrom || 'everyone',
  });

  const [profileSettings, setProfileSettings] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    title: user?.title || '',
    company: user?.company || '',
  });
  
  const [commentSettings, setCommentSettings] = useState({
    whoCanComment: user?.privacy?.whoCanComment || 'everyone',
  });

  useEffect(() => {
    if (user) {
      setPrivacySettings({
        profileVisibility: user.privacy?.profileVisibility || 'public',
        allowMessagesFrom: user.privacy?.allowMessagesFrom || 'everyone',
      });
      setProfileSettings({
        fullName: user.fullName || '',
        bio: user.bio || '',
        title: user.title || '',
        company: user.company || '',
      });
      setCommentSettings({
        whoCanComment: user.privacy?.whoCanComment || 'everyone',
      });
    }
  }, [user]);

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile({ privacy: { ...user.privacy, ...privacySettings } });
      if (res.data?.success) {
        updateUser(res.data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      toast.error('Could not update your privacy settings. Please try again.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile(profileSettings);
      if (res.data?.success) {
        updateUser(res.data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      toast.error('Could not update your profile. Please try again.');
    }
  };

  const handleSaveComments = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile({ privacy: { ...user.privacy, ...commentSettings } });
      if (res.data?.success) {
        updateUser(res.data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      toast.error('Could not update comment settings. Please try again.');
    }
  };

  const handleExportData = async () => {
    setLoadingExport(true);
    try {
      const res = await userAPI.exportData();
      if (res.data?.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `innofix_data_export_${user?.username || 'user'}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      toast.error('Could not download your data. Please try again.');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you absolutely sure? This will permanently delete your profile, posts, and applications. Type your username to confirm:'
    );
    if (confirmation === user?.username) {
      try {
        await userAPI.deleteAccount();
        toast.success('Account deleted.');
        logout();
      } catch (e) {
        toast.error('Could not delete your account. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
              Settings & Privacy
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your account settings, profile visibility, theme preferences, and saved items.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
          
          {/* Sidebar */}
          <div className="md:col-span-1 lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 h-fit">
            {[
              { id: 'privacy', label: 'Privacy & Access', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'profile', label: 'Edit Profile', icon: User },
              { id: 'comments', label: 'Comments', icon: MessageSquare },
              { id: 'saved', label: 'Saved Items', icon: Bookmark },
              { id: 'support', label: 'Help & Support', icon: HelpCircle },
              { id: 'account', label: 'Account Status', icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[11px] lg:text-xs font-bold transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-amber-400 text-slate-900 font-extrabold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="md:col-span-3 lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {saved && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </div>
            )}

            {activeTab === 'privacy' && (
              <form onSubmit={handleSavePrivacy} className="space-y-6 text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                    Privacy Controls
                  </h2>
                  <p className="text-slate-400">Control who can discover your profile and message you.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-500" /> Profile Visibility
                    </label>
                    <p className="text-slate-500 dark:text-slate-400">Choose who can see your bio, skills, and projects.</p>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) =>
                        setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="public">Public (everyone on INNOFIX)</option>
                      <option value="connections">Connections & Followers Only</option>
                      <option value="private">Private (Restricted)</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-500" /> Direct Messaging Permissions
                    </label>
                    <p className="text-slate-500 dark:text-slate-400">Choose who can send you messages.</p>
                    <select
                      value={privacySettings.allowMessagesFrom}
                      onChange={(e) =>
                        setPrivacySettings({ ...privacySettings, allowMessagesFrom: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="everyone">Everyone (Open for collaboration)</option>
                      <option value="followers">People I Follow / Mutual Connections</option>
                      <option value="none">Nobody (Disable inbound DMs)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Privacy Settings
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                    Appearance
                  </h2>
                  <p className="text-slate-400">Switch between light and dark modes across the app.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Current Mode: <span className="capitalize text-amber-600 dark:text-amber-400 font-black flex items-center">{darkMode ? <>Dark Mode <Moon className="w-4 h-4 inline-block ml-1" /></> : <>Light Mode <Sun className="w-4 h-4 inline-block ml-1" /></>}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">Toggle high-contrast Dark theme for low-light use.</p>
                  </div>

                  <button
                    onClick={toggleDarkMode}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span>Toggle Theme</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                    Edit Profile
                  </h2>
                  <p className="text-slate-400">Update your basic information visible to the community.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100">Full Name</label>
                    <input
                      type="text"
                      value={profileSettings.fullName}
                      onChange={(e) => setProfileSettings({ ...profileSettings, fullName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100">Professional Title</label>
                    <input
                      type="text"
                      value={profileSettings.title}
                      onChange={(e) => setProfileSettings({ ...profileSettings, title: e.target.value })}
                      placeholder="e.g. Frontend Developer"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100">Bio</label>
                    <textarea
                      value={profileSettings.bio}
                      onChange={(e) => setProfileSettings({ ...profileSettings, bio: e.target.value })}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400"
                    ></textarea>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100">Company / University</label>
                    <input
                      type="text"
                      value={profileSettings.company}
                      onChange={(e) => setProfileSettings({ ...profileSettings, company: e.target.value })}
                      placeholder="Where do you work or study?"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'comments' && (
              <form onSubmit={handleSaveComments} className="space-y-6 text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                    Comments
                  </h2>
                  <p className="text-slate-400">Manage who can interact and comment on your posts.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-500" /> Who can comment?
                    </label>
                    <p className="text-slate-500 dark:text-slate-400">Choose who is allowed to comment on your content.</p>
                    <select
                      value={commentSettings.whoCanComment}
                      onChange={(e) =>
                        setCommentSettings({ ...commentSettings, whoCanComment: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="followers">Followers & Connections Only</option>
                      <option value="none">No one (Disable comments)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Comment Settings
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'saved' && (
              <div>
                <SavedPage isEmbedded={true} />
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                    Help & Support
                  </h2>
                  <p className="text-slate-400">Get assistance and read about INNOFIX.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-500" /> FAQ
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Find answers to commonly asked questions about managing your account and building your network.
                    </p>
                    <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all font-bold text-slate-700 dark:text-slate-200">
                      View FAQ
                    </button>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" /> Contact Us
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Need direct help from the team? Reach out to our support channel.
                    </p>
                    <a href="mailto:support@innofix.example.com" className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold">
                      Email Support
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                    Account Status
                  </h2>
                  <p className="text-slate-400">Manage your account data and permanent deletion.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-500" /> Export Personal Archive (.JSON)
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Download all your profile skills, posted content, project pitches, bookmarks, and application records.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={loadingExport}
                    className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{loadingExport ? 'Preparing Archive...' : 'Download My Data Archive'}</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 space-y-3">
                  <h3 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Danger Zone: Delete Account
                  </h3>
                  <p className="text-rose-900/80 dark:text-rose-300 leading-relaxed">
                    Permanently delete your account, posts, comments, and connections. This action cannot be reversed.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-all"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
