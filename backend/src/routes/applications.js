const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  addApplication,
  findApplicationById,
  findJobById,
  isEmployerAuthorizedForJob,
  listApplications
} = require("../data/store");
const {
  extractEmployeeCredentials,
  extractEmployerCredentials,
  hasAnyCredentialPart,
  hasBothCredentials
} = require("../utils/employerCredentials");
const { isSafePath } = require("../utils/fileCleanup");

const router = express.Router();
const uploadDirectory = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream"
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniquePrefix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const isAllowedExtension = allowedExtensions.has(extension);
    const isAllowedMime = allowedMimeTypes.has((file.mimetype || "").toLowerCase());

    if (isAllowedExtension && isAllowedMime) {
      callback(null, true);
      return;
    }

    const validationError = new Error("Only PDF, DOC, or DOCX files are allowed for CV uploads.");
    validationError.statusCode = 400;
    callback(validationError);
  }
});

function sanitizeDownloadFileName(value) {
  return String(value || "cv-file")
    .replace(/[\r\n\t]/g, " ")
    .replaceAll('"', "")
    .trim() || "cv-file";
}

function toApplicationResponse(application, canViewCv) {
  const {
    cvFileName,
    ...rest
  } = application;

  return {
    ...rest,
    cvOriginalName: canViewCv ? rest.cvOriginalName : "",
    canViewCv: canViewCv && Boolean(cvFileName)
  };
}

function removeUploadedFile(file) {
  if (!file || !file.path) {
    return;
  }

  fs.unlink(file.path, () => {
    // Best effort cleanup for rejected uploads.
  });
}

router.get("/", (req, res) => {
  const credentials = extractEmployerCredentials(req);
  const rawJobId = req.query.jobId;

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

  if (!hasBothCredentials(credentials)) {
    res.json({
      data: [],
      count: 0,
      message: "Provide employer credentials to view applications"
    });
    return;
  }

  if (rawJobId === undefined) {
    const data = listApplications()
      .filter((application) => isEmployerAuthorizedForJob(
        application.jobId,
        credentials.employerEmail,
        credentials.employerKey
      ))
      .map((application) => toApplicationResponse(application, true));

    res.json({ data, count: data.length });
    return;
  }

  const jobId = Number.parseInt(rawJobId, 10);

  if (Number.isNaN(jobId)) {
    res.status(400).json({
      message: "Invalid job ID"
    });
    return;
  }

  const data = listApplications({ jobId })
    .filter((application) => isEmployerAuthorizedForJob(
      application.jobId,
      credentials.employerEmail,
      credentials.employerKey
    ))
    .map((application) => toApplicationResponse(application, true));

  res.json({ data, count: data.length });
});

router.post("/", upload.single("cvFile"), (req, res) => {
  const employeeCredentials = extractEmployeeCredentials(req);

  if (employeeCredentials.authMethod === "token-invalid") {
    removeUploadedFile(req.file);

    res.status(401).json({
      message: "Session expired. Please sign in again."
    });
    return;
  }

  if (employeeCredentials.authMethod === "token-role-mismatch") {
    removeUploadedFile(req.file);

    res.status(403).json({
      message: "Employee access is required to submit applications."
    });
    return;
  }

  if (String(process.env.REQUIRE_EMPLOYEE_AUTH || "true").toLowerCase() !== "false") {
    if (employeeCredentials.authMethod !== "token") {
      removeUploadedFile(req.file);

      res.status(401).json({
        message: "Please sign in as an employee before applying."
      });
      return;
    }
  }

  const {
    jobId,
    applicantName,
    applicantEmail,
    applicantPhone,
    coverLetter
  } = req.body;

  const parsedJobId = Number.parseInt(jobId, 10);
  const normalizedName = String(applicantName || "").trim();
  const normalizedEmail = String(
    employeeCredentials.authMethod === "token"
      ? employeeCredentials.employeeEmail
      : (applicantEmail || "")
  ).trim().toLowerCase();
  const normalizedPhone = String(applicantPhone || "").trim();
  const normalizedCoverLetter = String(coverLetter || "").trim();

  if (Number.isNaN(parsedJobId) || parsedJobId <= 0) {
    removeUploadedFile(req.file);

    res.status(400).json({
      message: "A valid jobId is required"
    });
    return;
  }

  if (!normalizedName || !normalizedEmail) {
    removeUploadedFile(req.file);

    res.status(400).json({
      message: "applicantName and applicantEmail are required"
    });
    return;
  }

  if (!normalizedEmail.includes("@") || normalizedEmail.length > 150 || normalizedName.length > 120) {
    removeUploadedFile(req.file);

    res.status(400).json({
      message: "Provide a valid applicantName and applicantEmail"
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      message: "A CV file is required"
    });
    return;
  }

  const job = findJobById(parsedJobId);

  if (!job) {
    removeUploadedFile(req.file);

    res.status(404).json({
      message: "Job not found"
    });
    return;
  }

  const application = addApplication({
    jobId: parsedJobId,
    applicantName: normalizedName,
    applicantEmail: normalizedEmail,
    applicantPhone: normalizedPhone,
    cvFileName: req.file.filename,
    cvOriginalName: req.file.originalname,
    coverLetter: normalizedCoverLetter
  });

  res.status(201).json({
    message: "Application submitted successfully",
    data: {
      ...toApplicationResponse(application, false),
      jobTitle: job.title,
      company: job.company
    }
  });
});

router.get("/:id/cv", (req, res) => {
  const applicationId = Number.parseInt(req.params.id, 10);
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

  if (Number.isNaN(applicationId)) {
    res.status(400).json({
      message: "Invalid application ID"
    });
    return;
  }

  if (!hasBothCredentials(credentials)) {
    res.status(401).json({
      message: "Employer credentials are required"
    });
    return;
  }

  const application = findApplicationById(applicationId);

  if (!application) {
    res.status(404).json({
      message: "Application not found"
    });
    return;
  }

  if (!application.cvFileName) {
    res.status(404).json({
      message: "CV file is not available for this application"
    });
    return;
  }

  const canAccess = isEmployerAuthorizedForJob(
    application.jobId,
    credentials.employerEmail,
    credentials.employerKey
  );

  if (!canAccess) {
    res.status(403).json({
      message: "You are not allowed to view this CV"
    });
    return;
  }

  const cvPath = path.resolve(uploadDirectory, application.cvFileName);

  if (!isSafePath(uploadDirectory, cvPath)) {
    res.status(400).json({
      message: "Invalid CV path"
    });
    return;
  }

  if (!fs.existsSync(cvPath)) {
    res.status(404).json({
      message: "CV file is missing from the server"
    });
    return;
  }

  const displayName = sanitizeDownloadFileName(application.cvOriginalName);
  res.setHeader("Content-Disposition", `inline; filename="${displayName}"`);
  res.sendFile(cvPath);
});

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        message: "CV size must be 5MB or smaller"
      });
      return;
    }

    res.status(400).json({
      message: error.message
    });
    return;
  }

  if (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Could not upload CV"
    });
    return;
  }

  res.status(500).json({
    message: "Unexpected error"
  });
});

module.exports = router;
