"use client";

import { useState } from 'react';
import { X, User, Palette, Save, Bell, Volume2, UserCog, Shield, Ban, Trophy, Zap, Star, Trash2, RefreshCw, Download, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import { useUpdate } from '@/hooks/useUpdate';
import { FONT_STYLES, TEXT_COLORS } from '@/types/database';
import { getUsernameStyle } from '@/utils/fontStyles';
import type { FontStyleId, TextColorId } from '@/types/database';

interface MobileSettingsModalProps {
  onClose: () => void;
}

const AVATAR_SEEDS = ['cool', 'tech', 'gamer', 'bit', 'shade', 'neo', 'pixel', 'basement', 'vapor', 'retro', 'funky', 'bottts'];

export function MobileSettingsModal({ onClose }: MobileSettingsModalProps) {
  const { session, myProfile, refetchProfiles } = useAuth();
  const toast = useToast();
  const { update: updateInfo, checkForUpdates } = useUpdate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  const [editUsername, setEditUsername] = useState(myProfile?.username || '');
  const [editTextColor, setEditTextColor] = useState(myProfile?.text_color || 'default');
  const [editFontStyle, setEditFontStyle] = useState(myProfile?.font_style || 'default');
  const [editAvatar, setEditAvatar] = useState(myProfile?.avatar_url || '');
  const [editStatus, setEditStatus] = useState(myProfile?.status || 'online');
  const [editEffect, setEditEffect] = useState(myProfile?.avatar_effect || 'none');
  const [editOverlay, setEditOverlay] = useState(myProfile?.avatar_overlay || 'none');
  const [reduceMotion, setReduceMotion] = useState(false);

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'avatar', label: 'Avatar', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'status', label: 'Status', icon: Volume2 },
    { id: 'appearance', label: 'Appearance', icon: UserCog },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'about', label: 'About', icon: Zap },
  ];

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: editUsername,
        text_color: editTextColor,
        font_style: editFontStyle,
        avatar_url: editAvatar,
        status: editStatus,
        avatar_effect: editEffect,
        avatar_overlay: editOverlay,
      })
      .eq('id', session?.user.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
      await refetchProfiles();
      onClose();
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' });
      if (res.ok) {
        await supabase.auth.signOut();
      } else {
        toast.error('Failed to delete account');
      }
    } catch {
      toast.error('Failed to delete account');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] animate-fade-in">
      <div className="w-full h-full bg-zinc-950 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
          <span className="text-lg font-semibold">Settings</span>
          <button 
            onClick={onClose} 
            className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all active:scale-95"
          >
            <X size={22} />
          </button>
        </div>
        
        {/* Tab Bar */}
        <div className="flex gap-1 px-3 py-3 border-b border-white/5 overflow-x-auto shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Username</label>
                <input 
                  className="w-full bg-zinc-900/80 p-4 rounded-xl border border-white/10 focus:border-indigo-500/50 text-base outline-none transition-all" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Text Color</label>
                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setEditTextColor(color.id as TextColorId)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                        editTextColor === color.id 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.color }}
                    >
                      {color.id === 'default' && (
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Font Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_STYLES.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setEditFontStyle(font.id as FontStyleId)}
                      className={`p-3 rounded-xl text-sm transition-all active:scale-95 ${
                        editFontStyle === font.id 
                          ? 'bg-indigo-600/30 border border-indigo-500/50' 
                          : 'bg-zinc-900/50 border border-transparent hover:border-white/10'
                      }`}
                      style={getUsernameStyle(font.id)}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'online', label: 'Online', color: 'bg-emerald-500' },
                    { value: 'away', label: 'Away', color: 'bg-yellow-500' },
                    { value: 'busy', label: 'Busy', color: 'bg-red-500' },
                    { value: 'dnd', label: 'DND', color: 'bg-red-600' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setEditStatus(option.value as any)}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all active:scale-95 ${
                        editStatus === option.value 
                          ? 'bg-indigo-600/30 border border-indigo-500/50' 
                          : 'bg-zinc-900/50 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${option.color}`} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Avatar Tab */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_SEEDS.map(s => {
                    const url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`;
                    return (
                      <button 
                        key={s} 
                        onClick={() => setEditAvatar(url)}
                        className={`aspect-square rounded-xl overflow-hidden transition-all active:scale-95 ${
                          editAvatar === url 
                            ? 'ring-2 ring-indigo-500 scale-105' 
                            : 'hover:ring-1 hover:ring-white/20'
                        }`}
                      >
                        <img src={url} className="w-full h-full object-cover bg-zinc-800" alt="" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Effect</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'none', name: 'None' },
                    { id: 'fire', name: 'Fire' },
                    { id: 'basketball', name: 'Basketball' },
                  ].map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => setEditEffect(effect.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all active:scale-95 ${
                        editEffect === effect.id 
                          ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-400' 
                          : 'bg-zinc-900/50 border border-transparent hover:border-white/10 text-zinc-400'
                      }`}
                    >
                      {effect.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {[
                { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you' },
                { key: 'replies', label: 'Replies', desc: 'When someone replies to you' },
                { key: 'invites', label: 'Channel Invites', desc: 'When invited to a channel' },
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                  <div>
                    <div className="text-sm text-white">{setting.label}</div>
                    <div className="text-xs text-zinc-500">{setting.desc}</div>
                  </div>
                  <div className="w-12 h-7 bg-indigo-600 rounded-full relative">
                    <span className="absolute top-1 left-6 w-5 h-5 rounded-full bg-white transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {[
                { value: 'online', label: 'Online', desc: 'Available to chat', color: 'bg-emerald-500' },
                { value: 'away', label: 'Away', desc: 'Away from keyboard', color: 'bg-yellow-500' },
                { value: 'busy', label: 'Busy', desc: 'Do not disturb', color: 'bg-red-500' },
                { value: 'dnd', label: 'DND', desc: 'Absolutely not', color: 'bg-red-600' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setEditStatus(option.value as any)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
                    editStatus === option.value 
                      ? 'bg-indigo-600/30 border border-indigo-500/50' 
                      : 'bg-zinc-900/50 border border-transparent hover:border-white/10'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${option.color}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{option.label}</div>
                    <div className="text-xs text-zinc-500">{option.desc}</div>
                  </div>
                  {editStatus === option.value && (
                    <Check size={18} className="ml-auto text-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl">
                <div>
                  <div className="text-sm text-white">Reduce Motion</div>
                  <div className="text-xs text-zinc-500">Minimize animations</div>
                </div>
                <button
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`w-12 h-7 rounded-full transition-all relative ${reduceMotion ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${reduceMotion ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden">
                    {myProfile?.avatar_url && <img src={myProfile.avatar_url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{myProfile?.username}</div>
                    <div className="text-xs text-zinc-500">{session?.user?.email}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 p-4 bg-red-600/20 border border-red-600/30 text-red-400 rounded-xl hover:bg-red-600/30 transition-all text-sm"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">B</span>
                </div>
                <h2 className="text-xl font-bold text-white">The Basement</h2>
                <p className="text-sm text-zinc-500">Version 1.0.0</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                  <Star size={16} className="text-amber-400" />
                  <span className="text-sm">Private messaging platform</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                  <Shield size={16} className="text-emerald-400" />
                  <span className="text-sm">End-to-end encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {activeTab !== 'about' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-md border-t border-white/5">
            <div className="flex gap-2">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <Save size={18} /> Save
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-4 text-zinc-400 hover:text-white bg-zinc-800/50 border border-white/10 hover:border-white/20 rounded-xl text-sm transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
