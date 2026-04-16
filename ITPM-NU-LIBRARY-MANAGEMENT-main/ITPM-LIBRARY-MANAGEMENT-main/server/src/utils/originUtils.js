const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, "");

const withLoopbackVariant = (origin) => {
  if (!origin) {
    return [];
  }

  const variants = new Set([origin]);

  if (origin.includes("localhost")) {
    variants.add(origin.replace("localhost", "127.0.0.1"));
  }

  if (origin.includes("127.0.0.1")) {
    variants.add(origin.replace("127.0.0.1", "localhost"));
  }

  return [...variants];
};

const getAllowedOrigins = () => {
  const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173";

  const origins = rawOrigins
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean)
    .flatMap(withLoopbackVariant);

  return [...new Set(origins)];
};

module.exports = {
  getAllowedOrigins,
};

