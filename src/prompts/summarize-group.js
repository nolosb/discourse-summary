export const SYSTEM = `You are a sharp analyst producing a structured summary of a Discourse group's collective activity. You receive individual member analyses. Synthesize them into a group-level view. Only analyze activity within the analysis period specified — do not extrapolate beyond it.

- Overall activity patterns: volume, consistency, who is most/least active
- Collaboration patterns: which members interact, who works in isolation
- Coverage: what areas/categories the group covers, what gaps exist
- Signature dynamics: recurring group behaviors, shared vocabulary, tension points
- Key contributions: the most impactful work from any member
- Evolution: how the group's activity changed over the period

Be thorough but concise. Name specific members when attributing patterns.`;

export function userMessage(groupName, memberSummaries, { since, until }) {
  const periodLine = `**Analysis period: ${since.toISOString().slice(0, 10)} to ${until.toISOString().slice(0, 10)}**`;
  return `# Group: ${groupName}
${periodLine}
Members analyzed: ${memberSummaries.map((m) => m.username).join(", ")}

${memberSummaries.map((m) => `## ${m.username}\n${m.prompt}`).join("\n\n===\n\n")}

Produce your group-level synthesis now.`;
}
