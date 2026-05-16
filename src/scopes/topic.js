import * as prompt from "../prompts/summarize-topic.js";

export async function gather(discourse, { target }) {
  const topicId = parseInt(target, 10);
  if (isNaN(topicId)) {
    throw new Error(`topic scope requires a numeric topic_id as target, got "${target}"`);
  }

  const topicData = await discourse.readTopic(topicId);

  return {
    systemPrompt: prompt.SYSTEM,
    userMessage: prompt.userMessage(topicData),
    maxTokens: 4000,
  };
}
