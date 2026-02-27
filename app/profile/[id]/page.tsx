import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Profile } from '@/types';
import ProfileView from '@/components/ProfileView';

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  return <ProfileView profile={profile as Profile} />;
}
