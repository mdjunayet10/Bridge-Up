const express = require("express");
const {
  getEmployeeProfileByCredentials,
  getEmployerProfileByCredentials,
  isEmployeeCredentialsValid,
  isEmployerCredentialsValid
} = require("../data/store");
const {
  createSession,
  revokeSession
} = require("../data/sessions");
const {
  extractBearerToken,
  getSessionFromRequest,
  normalizeEmail
} = require("../utils/employerCredentials");

const router = express.Router();

router.post("/login", (req, res) => {
  const payload = req.body || {};
  const rawRole = String(payload.role || "").trim().toLowerCase();

  const role = rawRole || (
    payload.employeeEmail || payload.employeePassword
      ? "employee"
      : "employer"
  );

  if (role !== "employer" && role !== "employee") {
    res.status(400).json({
      message: "role must be either 'employee' or 'employer'"
    });
    return;
  }

  if (role === "employer") {
    const employerEmail = normalizeEmail(payload.employerEmail || payload.email);
    const employerKey = String(payload.employerKey || payload.password || "").trim();

    if (!employerEmail || !employerKey) {
      res.status(400).json({
        message: "employerEmail and employerKey are required"
      });
      return;
    }

    if (!isEmployerCredentialsValid(employerEmail, employerKey)) {
      res.status(401).json({
        message: "Invalid employer credentials"
      });
      return;
    }

    const employerProfile = getEmployerProfileByCredentials(employerEmail, employerKey) || {
      email: employerEmail,
      name: "Career Bridge Employer"
    };

    const session = createSession({
      role: "employer",
      email: employerProfile.email,
      authSecret: employerKey,
      displayName: employerProfile.name
    });

    res.json({
      message: "Login successful",
      data: {
        accessToken: session.token,
        role: session.role,
        email: session.email,
        employerEmail: session.email,
        displayName: session.displayName,
        expiresAt: session.expiresAt
      }
    });
    return;
  }

  const employeeEmail = normalizeEmail(payload.employeeEmail || payload.email);
  const employeePassword = String(payload.employeePassword || payload.password || "").trim();

  if (!employeeEmail || !employeePassword) {
    res.status(400).json({
      message: "employeeEmail and employeePassword are required"
    });
    return;
  }

  if (!isEmployeeCredentialsValid(employeeEmail, employeePassword)) {
    res.status(401).json({
      message: "Invalid employee credentials"
    });
    return;
  }

  const employeeProfile = getEmployeeProfileByCredentials(employeeEmail, employeePassword) || {
    email: employeeEmail,
    name: "Career Bridge Employee"
  };

  const session = createSession({
    role: "employee",
    email: employeeProfile.email,
    authSecret: employeePassword,
    displayName: employeeProfile.name
  });

  res.json({
    message: "Login successful",
    data: {
      accessToken: session.token,
      role: session.role,
      email: session.email,
      displayName: session.displayName,
      expiresAt: session.expiresAt
    }
  });
});

router.get("/me", (req, res) => {
  const session = getSessionFromRequest(req);

  if (!session) {
    res.status(401).json({
      message: "Authentication required"
    });
    return;
  }

  res.json({
    data: {
      role: session.role,
      email: session.email,
      displayName: session.displayName,
      expiresAt: session.expiresAt
    }
  });
});

router.post("/logout", (req, res) => {
  const token = extractBearerToken(req);
  const removed = revokeSession(token);

  res.json({
    message: removed ? "Logged out successfully" : "No active session found"
  });
});

module.exports = router;
