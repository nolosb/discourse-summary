import * as prompt from "../prompts/custom-query.js";

export async function gather(discourse, { target, since, until }) {
  const afterDate = since.toISOString().slice(0, 10);
  const beforeDate = until.toISOString().slice(0, 10);
  const searchResults = await discourse.search(
    `${target} after:${afterDate} before:${beforeDate}`,
  );

  const topicIds = new Set();
  for (const post of (searchResults.posts || []).slice(0, 10)) {
    topicIds.add(post.topic_id);
  }
  for (const topic of (searchResults.topics || []).slice(0, 5)) {
    topicIds.add(topic.id);
  }

  const topics = await Promise.all(
    [...topicIds].slice(0, 8).map((id) => discourse.readTopic(id)),
  );

  const data = topics
    .map((t) => {
      const posts = t.post_stream?.posts || [];
      return `## ${t.title} (topic ${t.id})\n${posts.map((p) => `[${p.username}] ${p.cooked?.replace(/<[^>]+>/g, "") || ""}`).join("\n\n")}`;
    })
    .join("\n\n===\n\n");

  return {
    systemPrompt: prompt.SYSTEM,
    userMessage: prompt.userMessage(target, data),
    maxTokens: 4000,
  };
}
