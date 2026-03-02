'use client';

import { useEffect, useState } from 'react';
import type { Profile } from '@/types';
import ProfileView from './ProfileView';

interface ProfileViewWrapperProps {
  profile: Profile;
}

export default function ProfileViewWrapper({ profile }: ProfileViewWrapperProps) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Check if current user owns this profile
    const storedProfileId = localStorage.getItem('mission_match_profile_id');
    setIsOwner(storedProfileId === profile.id);
  }, [profile.id]);

  return <ProfileView profile={profile} isOwner={isOwner} />;
}
