import rateLimit from "express-rate-limit";

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: { message: "AI is busy, try again in a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

export default aiRateLimit;
