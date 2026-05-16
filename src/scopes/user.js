import * as prompt from "../prompts/summarize-user.js";

export async function gather(discourse, { target, since, until }) {
  const userData = await discourse.getUser(target);

  let allPosts = [];
  let offset = 0;
  while (true) {
    const batch = await discourse.listUserPosts(target, { offset });
    const actions = batch.user_actions || [];
    if (actions.length === 0) break;

    const oldest = new Date(actions[actions.length - 1].created_at);
    allPosts.push(...actions);

    if (oldest < since) break;
    offset += actions.length;
  }

  allPosts = allPosts.filter((p) => {
    const d = new Date(p.created_at);
    return d >= since && d <= until;
  });

  const topicCounts = {};
  for (const p of allPosts) {
    topicCounts[p.topic_id] = (topicCounts[p.topic_id] || 0) + 1;
  }
  const topTopicIds = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => Number(id));

  const topics = await Promise.all(
    topTopicIds.map((id) => discourse.readTopic(id)),
  );

  const sample = allPosts.slice(0, 200);
  return {
    systemPrompt: prompt.SYSTEM,
    userMessage: prompt.userMessage(userData.user || userData, sample, topics, {
      since,
      until,
    }),
    maxTokens: 12000,
    meta: { postCount: allPosts.length },
  };
}
