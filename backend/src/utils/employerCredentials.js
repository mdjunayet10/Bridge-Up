const { getSessionByToken } = require("../data/sessions");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmployerEmail(value) {
  return normalizeEmail(value);
}

function getFirstDefinedValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return "";
}

function extractEmployerCredentials(req, options = {}) {
  const { includeBody = false } = options;
  const bearerToken = extractBearerToken(req);

  if (bearerToken) {
    const session = getSessionByToken(bearerToken);

    if (!session) {
      return {
        employerEmail: "",
        employerKey: "",
        authMethod: "token-invalid"
      };
    }

    if (session.role !== "employer") {
      return {
        employerEmail: "",
        employerKey: "",
        authMethod: "token-role-mismatch"
      };
    }

    return {
      employerEmail: normalizeEmployerEmail(session.email || session.employerEmail),
      employerKey: String(session.authSecret || session.employerKey || "").trim(),
      authMethod: "token"
    };
  }

  const body = includeBody ? (req.body || {}) : {};

  const employerEmail = normalizeEmployerEmail(
    getFirstDefinedValue(
      req.header("x-employer-email"),
      req.query.employerEmail,
      body.employerEmail
    )
  );

  const employerKey = String(
    getFirstDefinedValue(
      req.header("x-employer-key"),
      req.query.employerKey,
      body.employerKey
    ) || ""
  ).trim();

  return {
    employerEmail,
    employerKey,
    authMethod: "credentials"
  };
}

function extractEmployeeCredentials(req, options = {}) {
  const { includeBody = false } = options;
  const bearerToken = extractBearerToken(req);

  if (bearerToken) {
    const session = getSessionByToken(bearerToken);

    if (!session) {
      return {
        employeeEmail: "",
        employeePassword: "",
        displayName: "",
        authMethod: "token-invalid"
      };
    }

    if (session.role !== "employee") {
      return {
        employeeEmail: "",
        employeePassword: "",
        displayName: "",
        authMethod: "token-role-mismatch"
      };
    }

    return {
      employeeEmail: normalizeEmail(session.email),
      employeePassword: "",
      displayName: String(session.displayName || ""),
      authMethod: "token"
    };
  }

  const body = includeBody ? (req.body || {}) : {};
  const employeeEmail = normalizeEmail(
    getFirstDefinedValue(
      req.header("x-employee-email"),
      req.query.employeeEmail,
      body.employeeEmail,
      body.email
    )
  );

  const employeePassword = String(
    getFirstDefinedValue(
      req.header("x-employee-password"),
      req.query.employeePassword,
      body.employeePassword,
      body.password
    ) || ""
  ).trim();

  return {
    employeeEmail,
    employeePassword,
    displayName: "",
    authMethod: "credentials"
  };
}

function extractBearerToken(req) {
  const authHeader = String(req.header("authorization") || "").trim();

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function getEmployerSessionFromRequest(req) {
  const token = extractBearerToken(req);

  if (!token) {
    return null;
  }

  return getSessionByToken(token);
}

function getSessionFromRequest(req) {
  const token = extractBearerToken(req);

  if (!token) {
    return null;
  }

  return getSessionByToken(token);
}

function hasAnyCredentialPart(credentials) {
  return Boolean(credentials.employerEmail || credentials.employerKey);
}

function hasBothCredentials(credentials) {
  return Boolean(credentials.employerEmail && credentials.employerKey);
}

function hasAnyEmployeeCredentialPart(credentials) {
  return Boolean(credentials.employeeEmail || credentials.employeePassword);
}

function hasBothEmployeeCredentials(credentials) {
  return Boolean(credentials.employeeEmail && credentials.employeePassword);
}

module.exports = {
  extractBearerToken,
  extractEmployeeCredentials,
  extractEmployerCredentials,
  getSessionFromRequest,
  getEmployerSessionFromRequest,
  hasAnyEmployeeCredentialPart,
  hasAnyCredentialPart,
  hasBothEmployeeCredentials,
  hasBothCredentials,
  normalizeEmail,
  normalizeEmployerEmail
};
