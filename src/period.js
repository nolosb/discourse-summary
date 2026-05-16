export function parsePeriod(period) {
  if (!period) {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    return { since, until: new Date() };
  }

  const dateRange = period.match(
    /^(\d{4}-\d{2}-\d{2})\s*(?:to|-|\.\.)\s*(\d{4}-\d{2}-\d{2})$/,
  );
  if (dateRange) {
    return { since: new Date(dateRange[1]), until: new Date(dateRange[2]) };
  }

  const relative = period.match(/^(\d+)\s*(day|week|month|year)s?$/i);
  if (relative) {
    const n = parseInt(relative[1], 10);
    const unit = relative[2].toLowerCase();
    const since = new Date();
    if (unit === "day") since.setDate(since.getDate() - n);
    else if (unit === "week") since.setDate(since.getDate() - n * 7);
    else if (unit === "month") since.setMonth(since.getMonth() - n);
    else if (unit === "year") since.setFullYear(since.getFullYear() - n);
    return { since, until: new Date() };
  }

  throw new Error(
    `Cannot parse period "${period}". Use "6 months", "2 weeks", or "2025-01-01 to 2025-06-01".`,
  );
}
