const BASE_HEADERS = {
  Accept: "application/json",
  "User-Agent": "discourse-summary/0.1",
};

function headers(config) {
  const hdrs = { ...BASE_HEADERS };
  if (config.discourseUserApiKey) {
    hdrs["User-Api-Key"] = config.discourseUserApiKey;
    if (config.discourseUserApiClientId) {
      hdrs["User-Api-Client-Id"] = config.discourseUserApiClientId;
    }
  } else if (config.discourseApiKey) {
    hdrs["Api-Key"] = config.discourseApiKey;
    if (config.discourseApiUsername) {
      hdrs["Api-Username"] = config.discourseApiUsername;
    }
  }
  return hdrs;
}

export function createClient(config) {
  const base = config.discourseUrl.replace(/\/+$/, "");
  const hdrs = headers(config);

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function get(path, retries = 3) {
    const url = `${base}${path}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(url, { headers: hdrs });
      if (res.status === 429) {
        const wait = parseInt(res.headers.get("retry-after") || "0", 10);
        const delay = Math.max(wait, 10) * 1000;
        if (attempt < retries) {
          await sleep(delay);
          continue;
        }
      }
      if (!res.ok) {
        throw new Error(`Discourse API ${res.status}: ${url}`);
      }
      return res.json();
    }
  }

  return {
    async getUser(username) {
      return get(`/u/${encodeURIComponent(username)}.json`);
    },

    async listUserPosts(username, { offset = 0 } = {}) {
      return get(
        `/user_actions.json?username=${encodeURIComponent(username)}&filter=4,5&offset=${offset}`,
      );
    },

    async readTopic(topicId) {
      return get(`/t/${topicId}.json`);
    },

    async readPost(postId) {
      return get(`/posts/${postId}.json`);
    },

    async search(query) {
      return get(`/search.json?q=${encodeURIComponent(query)}`);
    },

    async getGroup(name) {
      return get(`/groups/${encodeURIComponent(name)}.json`);
    },

    async getGroupMembers(name, { offset = 0, limit = 50 } = {}) {
      return get(
        `/groups/${encodeURIComponent(name)}/members.json?offset=${offset}&limit=${limit}`,
      );
    },
  };
}
