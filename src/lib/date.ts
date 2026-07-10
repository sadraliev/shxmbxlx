export const formatDate = (
  d: Date,
  month: "short" | "long" = "short",
): string =>
  d.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
