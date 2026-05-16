export const SYSTEM = `You are an analyst answering questions about Discourse forum data. You have been given raw data from a Discourse instance. Answer the user's question based strictly on this data. Be concise and precise. Use real usernames and quote relevant posts when helpful. If the data doesn't contain enough information to answer, say so.`;

export function userMessage(question, data) {
  return `# Question
${question}

# Data
${data}

Answer the question based on the data above.`;
}
