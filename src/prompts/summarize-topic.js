export const SYSTEM = `You are a concise analyst summarizing a Discourse discussion thread. Focus on:
- What the topic is about (1-2 sentences)
- Key positions and who holds them (use real usernames)
- Decisions made or conclusions reached
- Unresolved questions or open threads
- Notable quotes that capture the thread's character

Be factual and precise. No opinions beyond what the data supports.`;

export function userMessage(topicData) {
  const posts = topicData.post_stream?.posts || [];
  return `# Topic: ${topicData.title}
Category: ${topicData.category_id} | Posts: ${posts.length} | Created: ${topicData.created_at}

# Posts
${posts.map((p) => `[${p.username} — ${p.created_at}]\n${p.cooked?.replace(/<[^>]+>/g, "") || ""}`).join("\n\n---\n\n")}

Produce your structured summary now.`;
}
