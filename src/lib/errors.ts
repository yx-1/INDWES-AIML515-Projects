export function toUserFriendlyError(
  error: unknown,
  context: 'search' | 'history' | 'feedback' | 'auth' | 'delete'
): string {
  const message = error instanceof Error ? error.message : String(error || '');
  const lower = message.toLowerCase();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network failure')
  ) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (context === 'search') {
    if (lower.includes('no matching source')) {
      return 'No official municipal reference was found for that city and permit category. Try another question or category.';
    }
    if (lower.includes('gemini') || lower.includes('ai model')) {
      return 'The permit research service is temporarily unavailable. Please try again in a moment.';
    }
    if (message && !lower.includes('firestore') && !lower.includes('internal')) {
      return message;
    }
    return 'Unable to retrieve the permit checklist. Please try again in a moment.';
  }

  if (context === 'history') {
    return 'Your saved searches could not be loaded from the cloud. Local history on this device is still available.';
  }

  if (context === 'feedback') {
    return 'Your rating was saved on this device, but it could not be stored in the cloud. You can keep working.';
  }

  if (context === 'delete') {
    return 'The search was removed on this device, but it could not be updated in the cloud.';
  }

  if (context === 'auth') {
    if (lower.includes('popup-closed') || lower.includes('cancelled')) {
      return 'Sign-in was cancelled before it finished. You can try again when you are ready.';
    }
    if (lower.includes('popup-blocked')) {
      return 'The sign-in window was blocked. Please allow pop-ups for this site and try again.';
    }
    return message || 'Google sign-in could not be completed. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}
