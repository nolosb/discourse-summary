export const SYSTEM = `You are an analyst summarizing a Discourse forum user's activity. Write in plain, precise language. Only analyze activity within the analysis period specified in the data — do not extrapolate beyond it.

Produce a structured summary covering:
- Activity overview: post volume, frequency, categories active in
- Key contributions: the most substantive posts or threads
- Topics and themes: what subjects they engage with most
- Collaboration: who they interact with, how they engage (questions, answers, reviews, proposals)

Be concise. Cite specific posts or threads where relevant.`;

export function userMessage(userData, posts, topics, { since, until } = {}) {
  const periodLine =
    since && until
      ? `**Analysis period: ${since.toISOString().slice(0, 10)} to ${until.toISOString().slice(0, 10)}**\n\n`
      : "";
  return `# User Profile
${periodLine}${JSON.stringify(userData, null, 2)}

# Post Activity (${posts.length} posts)
${posts.map((p) => `[${p.created_at}] topic:${p.topic_id} — ${p.title || ""}\n${p.excerpt || p.raw || ""}`).join("\n---\n")}

# Full Topics (${topics.length} threads)
${topics.map((t) => `## ${t.title} (topic ${t.id})\n${(t.post_stream?.posts || []).map((p) => `[${p.username}] ${p.cooked?.replace(/<[^>]+>/g, "") || ""}`).join("\n\n")}`).join("\n\n===\n\n")}

Produce your structured analysis now.`;
}
