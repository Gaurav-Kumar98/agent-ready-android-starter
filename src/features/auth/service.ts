import { Sentry } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';

type AuthResult = { error: string | null };

const GENERIC_ERROR = "Couldn't reach the server. Check your connection and try again.";

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    return { error: null };
  }
  if (error.message.toLowerCase().includes('invalid login credentials')) {
    return { error: 'Email or password is incorrect.' };
  }
  Sentry.captureException(error);
  return { error: GENERIC_ERROR };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult & { needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with this email already exists.', needsEmailConfirmation: false };
    }
    if (error.message.toLowerCase().includes('password')) {
      return { error: 'Password must be at least 6 characters.', needsEmailConfirmation: false };
    }
    Sentry.captureException(error);
    return { error: GENERIC_ERROR, needsEmailConfirmation: false };
  }
  // With email confirmation enabled (Supabase cloud default) there is no
  // session yet — the user has to click the link in their inbox first.
  return { error: null, needsEmailConfirmation: data.session === null };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    Sentry.captureException(error);
    return { error: "Couldn't sign you out. Try again." };
  }
  return { error: null };
}
