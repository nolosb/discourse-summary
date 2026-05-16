import * as userScope from "./user.js";
import * as prompt from "../prompts/summarize-group.js";

export async function gather(discourse, { target, since, until }) {
  const membersData = await discourse.getGroupMembers(target);
  const members = (membersData.members || []).slice(0, 20);

  if (members.length === 0) {
    throw new Error(`Group "${target}" has no members or does not exist`);
  }

  const memberSummaries = [];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    try {
      const result = await userScope.gather(discourse, {
        target: member.username,
        since,
        until,
      });
      memberSummaries.push({
        username: member.username,
        prompt: result.userMessage,
      });
    } catch {
      memberSummaries.push({
        username: member.username,
        prompt: `[Error fetching data for ${member.username}]`,
      });
    }
  }

  return {
    systemPrompt: prompt.SYSTEM,
    userMessage: prompt.userMessage(target, memberSummaries, { since, until }),
    maxTokens: 12000,
  };
}
