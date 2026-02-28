import { createClient } from '@/lib/supabase/server';
import { ProfileView } from '@/components/profile/profile-view';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ProfileView userEmail={user?.email ?? ''} />;
}
