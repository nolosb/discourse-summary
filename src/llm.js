export function createLlmClient(config) {
  const base = config.llmBaseUrl.replace(/\/+$/, "");

  return {
    async complete(systemPrompt, userMessage, { maxTokens = 8000 } = {}) {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.llmApiKey && {
            Authorization: `Bearer ${config.llmApiKey}`,
          }),
        },
        body: JSON.stringify({
          model: config.llmModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LLM API ${res.status}: ${body}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    },
  };
}
