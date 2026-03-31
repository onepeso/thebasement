import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChallengeType } from '@/types/database';

interface ChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  goal: number;
  xp_reward: number;
  icon: string;
  badge_id?: string;
}

interface UserChallengeRecord {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
}

interface ChallengeWithProgress extends ChallengeDefinition {
  progress: number;
  completed: boolean;
  completed_at?: string;
}

export function useChallenges(userId: string | undefined) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newCompletedChallenge, setNewCompletedChallenge] = useState<ChallengeWithProgress | null>(null);
  const [hasTrackedLogin, setHasTrackedLogin] = useState(false);

  const fetchChallenges = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data: allChallenges } = await supabase
        .from('challenges')
        .select('*')
        .order('xp_reward', { ascending: true });

      const { data: userChallenges } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId);

      const userChallengeMap = new Map<string, UserChallengeRecord>();
      (userChallenges || []).forEach((uc: UserChallengeRecord) => {
        userChallengeMap.set(uc.challenge_id, uc);
      });

      const challengesWithProgress: ChallengeWithProgress[] = (allChallenges || []).map((challenge: ChallengeDefinition) => {
        const userChallenge = userChallengeMap.get(challenge.id);
        return {
          ...challenge,
          progress: userChallenge?.progress || 0,
          completed: userChallenge?.completed || false,
          completed_at: userChallenge?.completed_at,
        };
      });

      const completedXP = challengesWithProgress
        .filter(c => c.completed)
        .reduce((sum, c) => sum + c.xp_reward, 0);

      setChallenges(challengesWithProgress);
      setTotalXP(completedXP);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchChallenges:', err);
      setLoading(false);
    }
  }, [userId]);

  const updateChallenge = useCallback(async (
    type: ChallengeType,
    increment: number = 1
  ) => {
    if (!userId) return;

    const relevantChallenges = challenges.filter(c => c.type === type);
    if (relevantChallenges.length === 0) return;

    try {
      const { data: existingUserChallenges } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId);

      const existingMap = new Map<string, UserChallengeRecord>();
      (existingUserChallenges || []).forEach((uc: UserChallengeRecord) => {
        existingMap.set(uc.challenge_id, uc);
      });

      let newlyCompleted: ChallengeWithProgress | null = null;

      for (const challenge of relevantChallenges) {
        const existing = existingMap.get(challenge.id);
        
        if (existing?.completed) continue;

        const newProgress = (existing?.progress || 0) + increment;
        const isNowComplete = newProgress >= challenge.goal;

        if (existing) {
          await supabase
            .from('user_challenges')
            .update({
              progress: newProgress,
              completed: isNowComplete,
              completed_at: isNowComplete ? new Date().toISOString() : null,
            })
            .eq('id', existing.id);

          if (isNowComplete) {
            newlyCompleted = { ...challenge, progress: newProgress, completed: true, completed_at: new Date().toISOString() };
          }
        } else {
          await supabase
            .from('user_challenges')
            .insert({
              user_id: userId,
              challenge_id: challenge.id,
              progress: newProgress,
              completed: isNowComplete,
              completed_at: isNowComplete ? new Date().toISOString() : null,
            });

          if (isNowComplete) {
            newlyCompleted = { ...challenge, progress: newProgress, completed: true, completed_at: new Date().toISOString() };
          }
        }
      }

      await fetchChallenges();

      if (newlyCompleted) {
        setNewCompletedChallenge(newlyCompleted);
        
        // Update profile XP
        const newTotalXP = totalXP + newlyCompleted.xp_reward;
        await supabase
          .from('profiles')
          .update({ total_xp: newTotalXP })
          .eq('id', userId);
        
        // Unlock linked badge if exists
        if (newlyCompleted.badge_id) {
          await supabase
            .from('user_badges')
            .upsert({
              user_id: userId,
              badge_id: newlyCompleted.badge_id,
            }, {
              onConflict: 'user_id, badge_id',
              ignoreDuplicates: true,
            });
        }
      }
    } catch (err) {
      console.error('Error updating challenge:', err);
    }
  }, [userId, challenges, fetchChallenges, totalXP]);

  const trackLogin = useCallback(async () => {
    if (!userId || hasTrackedLogin) return;

    try {
      const { data: existing } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', 'first-login')
        .single();

      if (!existing) {
        await supabase
          .from('user_challenges')
          .insert({
            user_id: userId,
            challenge_id: 'first-login',
            progress: 1,
            completed: true,
            completed_at: new Date().toISOString(),
          });

        await fetchChallenges();

        const welcomeChallenge = challenges.find(c => c.id === 'first-login');
        if (welcomeChallenge) {
          setNewCompletedChallenge({ 
            ...welcomeChallenge, 
            progress: 1, 
            completed: true, 
            completed_at: new Date().toISOString() 
          });
          
          // Update profile XP
          const newTotalXP = totalXP + welcomeChallenge.xp_reward;
          await supabase
            .from('profiles')
            .update({ total_xp: newTotalXP })
            .eq('id', userId);
          
          // Unlock linked badge if exists
          if (welcomeChallenge.badge_id) {
            await supabase
              .from('user_badges')
              .upsert({
                user_id: userId,
                badge_id: welcomeChallenge.badge_id,
              }, {
                onConflict: 'user_id, badge_id',
                ignoreDuplicates: true,
              });
          }
        }
      }
      
      setHasTrackedLogin(true);
    } catch (err) {
      console.error('Error tracking login:', err);
    }
  }, [userId, hasTrackedLogin, challenges, fetchChallenges, totalXP]);

  const trackMessage = useCallback(async () => {
    await updateChallenge('first_message', 1);
    await updateChallenge('send_messages', 1);
  }, [updateChallenge]);

  const trackReaction = useCallback(async () => {
    await updateChallenge('reactions_given', 1);
  }, [updateChallenge]);

  const trackPin = useCallback(async () => {
    await updateChallenge('pins_created', 1);
  }, [updateChallenge]);

  const trackReply = useCallback(async () => {
    await updateChallenge('replies_sent', 1);
  }, [updateChallenge]);

  const trackMention = useCallback(async () => {
    await updateChallenge('mentions_sent', 1);
  }, [updateChallenge]);

  const trackChannelCreated = useCallback(async () => {
    await updateChallenge('channels_created', 1);
  }, [updateChallenge]);

  const clearNewCompleted = useCallback(() => {
    setNewCompletedChallenge(null);
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [userId]);

  return {
    challenges,
    totalXP,
    loading,
    newCompletedChallenge,
    trackLogin,
    trackMessage,
    trackReaction,
    trackPin,
    trackReply,
    trackMention,
    trackChannelCreated,
    clearNewCompleted,
  };
}
