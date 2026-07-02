/** Strip internal paths/commands before showing errors in Instagram DMs. */
export function userFacingProcessingError(errorMessage?: string): string | null {
  if (!errorMessage?.trim()) {
    return null;
  }

  const message = errorMessage.trim();
  const lower = message.toLowerCase();

  if (
    lower.includes('ffmpeg') ||
    lower.includes('command failed') ||
    lower.includes('cannot execute binary') ||
    lower.includes('enoexec')
  ) {
    return 'Our media processor hit a snag on this one.';
  }

  if (lower.includes('apify') || lower.includes('instagram scrape')) {
    return 'We had trouble fetching this post from Instagram.';
  }

  if (
    lower.includes('openai') ||
    lower.includes('embedding') ||
    lower.includes('qdrant')
  ) {
    return 'Something went wrong while organizing this save.';
  }

  if (
    message.includes('/') ||
    message.includes('\\') ||
    lower.includes('enoent') ||
    lower.includes('spawn ')
  ) {
    return 'Something went wrong while analyzing this save.';
  }

  return message.length > 160 ? `${message.slice(0, 159)}…` : message;
}
