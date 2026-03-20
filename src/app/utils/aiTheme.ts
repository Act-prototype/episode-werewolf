export async function generateAITheme(currentTheme?: string, customPrompt?: string): Promise<{ category: string; topic: string }> {
  const res = await fetch('/api/generate-theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentTheme, customPrompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'AI theme generation failed');
  }
  return res.json();
}
