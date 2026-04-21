const express = require("express");
const path = require("path");
const {
  addJob,
  findJobById,
  isEmployerCredentialsValid,
  isEmployerAuthorizedForJob,
  listJobs,
  removeApplicationsByJobId,
  removeJobById
} = require("../data/store");
const {
  extractEmployerCredentials,
  hasAnyCredentialPart,
  hasBothCredentials,
  normalizeEmployerEmail
} = require("../utils/employerCredentials");
const { cleanupFiles } = require("../utils/fileCleanup");

const router = express.Router();
const uploadDirectory = path.resolve(__dirname, "../../uploads");

function normalizeRequirements(requirements) {
  if (Array.isArray(requirements)) {
    return requirements
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof requirements !== "string") {
    return [];
  }

  return requirements
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPublicJob(job) {
  const {
    employerEmail,
    employerKey,
    ...publicJob
  } = job;

  return publicJob;
}

router.get("/", (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const location = String(req.query.location || "").trim().toLowerCase();
  const type = String(req.query.type || "").trim().toLowerCase();
  const credentials = extractEmployerCredentials(req);
  const jobs = listJobs();

  if (credentials.authMethod === "token-invalid") {
    res.status(401).json({
      message: "Session expired. Please sign in again."
    });
    return;
  }

  if (credentials.authMethod === "token-role-mismatch") {
    res.status(403).json({
      message: "Employer access is required for this action."
    });
    return;
  }

  if (hasAnyCredentialPart(credentials) && !hasBothCredentials(credentials)) {
    res.status(400).json({
      message: "Both employerEmail and employerKey are required"
    });
    return;
  }

  const scopedJobs = hasBothCredentials(credentials)
    ? jobs.filter((job) => isEmployerAuthorizedForJob(job.id, credentials.employerEmail, credentials.employerKey))
    : jobs;

  const filtered = scopedJobs.filter((job) => {
    const target = `${job.title} ${job.company} ${job.location}`.toLowerCase();
    const queryMatch = !query || target.includes(query);
    const locationMatch = !location || job.location.toLowerCase().includes(location);
    const typeMatch = !type || job.type.toLowerCase().includes(type);

    return queryMatch && locationMatch && typeMatch;
  });

  res.json({
    data: filtered.map(toPublicJob),
    count: filtered.length,
    total: scopedJobs.length
  });
});

router.get("/:id", (req, res) => {
  const jobId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(jobId)) {
    res.status(400).json({
      message: "Invalid job ID"
    });
    return;
  }

  const job = findJobById(jobId);

  if (!job) {
    res.status(404).json({
      message: "Job not found"
    });
    return;
  }

  res.json({
    data: toPublicJob(job)
  });
});

router.post("/", (req, res) => {
  const {
    title,
    company,
    location,
    type,
    salary,
    description,
    requirements,
    employerEmail,
    employerKey
  } = req.body;

  const credentials = extractEmployerCredentials(req, { includeBody: true });
  const normalizedTitle = String(title || "").trim();
  const normalizedCompany = String(company || "").trim();
  const normalizedLocation = String(location || "").trim();
  const normalizedType = String(type || "").trim();
  const normalizedSalary = String(salary || "").trim();
  const normalizedDescription = String(description || "").trim();

  if (credentials.authMethod === "token-invalid") {
    res.status(401).json({
      message: "Session expired. Please sign in again."
    });
    return;
  }

  if (credentials.authMethod === "token-role-mismatch") {
    res.status(403).json({
      message: "Employer access is required for this action."
    });
    return;
  }

  if (!normalizedTitle || !normalizedCompany || !hasBothCredentials(credentials)) {
    res.status(400).json({
      message: "title, company, employerEmail, and employerKey are required"
    });
    return;
  }

  if (!isEmployerCredentialsValid(credentials.employerEmail, credentials.employerKey)) {
    res.status(401).json({
      message: "Invalid employer credentials"
    });
    return;
  }

  if (normalizedTitle.length > 120 || normalizedCompany.length > 120) {
    res.status(400).json({
      message: "title and company must be 120 characters or less"
    });
    return;
  }

  const newJob = addJob({
    title: normalizedTitle,
    company: normalizedCompany,
    location: normalizedLocation || "Unknown",
    type: normalizedType || "Not specified",
    salary: normalizedSalary || "Not specified",
    description: normalizedDescription,
    requirements: normalizeRequirements(requirements),
    employerEmail: credentials.employerEmail || normalizeEmployerEmail(employerEmail),
    employerKey: credentials.employerKey || String(employerKey || "").trim()
  });

  res.status(201).json({
    message: "Job posted successfully",
    data: toPublicJob(newJob)
  });
});

router.delete("/:id", (req, res) => {
  const jobId = Number.parseInt(req.params.id, 10);
  const credentials = extractEmployerCredentials(req);

  if (credentials.authMethod === "token-invalid") {
    res.status(401).json({
      message: "Session expired. Please sign in again."
    });
    return;
  }

  if (credentials.authMethod === "token-role-mismatch") {
    res.status(403).json({
      message: "Employer access is required for this action."
    });
    return;
  }

  if (Number.isNaN(jobId)) {
    res.status(400).json({
      message: "Invalid job ID"
    });
    return;
  }

  if (!hasBothCredentials(credentials)) {
    res.status(401).json({
      message: "Employer credentials are required"
    });
    return;
  }

  if (!isEmployerAuthorizedForJob(jobId, credentials.employerEmail, credentials.employerKey)) {
    res.status(403).json({
      message: "You are not allowed to delete this job"
    });
    return;
  }

  const removedJob = removeJobById(jobId);

  if (!removedJob) {
    res.status(404).json({
      message: "Job not found"
    });
    return;
  }

  const removedApplications = removeApplicationsByJobId(jobId);
  const cvFileNames = removedApplications.map((application) => application.cvFileName).filter(Boolean);
  cleanupFiles(uploadDirectory, cvFileNames);

  res.json({
    message: "Job removed successfully",
    data: {
      ...toPublicJob(removedJob),
      removedApplicationCount: removedApplications.length
    }
  });
});

module.exports = router;
