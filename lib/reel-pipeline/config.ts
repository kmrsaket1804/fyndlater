import 'server-only';

export function isReelPipelineConfigured() {
  return Boolean(process.env.APIFY_TOKEN && process.env.OPENAI_API_KEY);
}
