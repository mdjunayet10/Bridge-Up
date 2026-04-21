const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const jobsRouter = require("./routes/jobs");
const salariesRouter = require("./routes/salaries");
const applicationsRouter = require("./routes/applications");
const authRouter = require("./routes/auth");

const app = express();
const port = process.env.PORT || 4000;
const frontendRoot = path.resolve(__dirname, "../..");
const corsOrigin = process.env.CLIENT_ORIGIN || "*";
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 120);

if (String(process.env.TRUST_PROXY || "false").toLowerCase() === "true") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again shortly."
  }
});

app.use("/api", apiLimiter);
app.use(express.static(frontendRoot));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Career Bridge backend skeleton is running"
  });
});

app.use("/api/jobs", jobsRouter);
app.use("/api/salaries", salariesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/auth", authRouter);

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendRoot, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl
  });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled error:", error);

  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Internal server error"
  });
});

app.listen(port, () => {
  console.log(`Career Bridge backend running at http://localhost:${port}`);
});
