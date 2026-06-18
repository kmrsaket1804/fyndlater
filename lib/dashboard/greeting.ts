export function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = name?.split(' ')[0] || 'there';
  return { time, firstName };
}
