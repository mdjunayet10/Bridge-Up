const salaries = [
  {
    role: "Frontend Developer",
    salaryRange: "BDT 30,000 - 70,000",
    level: "Junior to Mid",
    trend: "High demand"
  },
  {
    role: "Backend Developer",
    salaryRange: "BDT 40,000 - 90,000",
    level: "Mid",
    trend: "Growing"
  },
  {
    role: "UI/UX Designer",
    salaryRange: "BDT 25,000 - 65,000",
    level: "Junior to Mid",
    trend: "Stable"
  },
  {
    role: "Data Analyst",
    salaryRange: "BDT 35,000 - 80,000",
    level: "Mid",
    trend: "High demand"
  },
  {
    role: "Quality Assurance Engineer",
    salaryRange: "BDT 28,000 - 60,000",
    level: "Junior to Mid",
    trend: "Stable"
  },
  {
    role: "DevOps Engineer",
    salaryRange: "BDT 55,000 - 110,000",
    level: "Mid to Senior",
    trend: "Growing"
  }
];

const employers = [
  {
    email: "employer@careerbridge.com",
    key: "demo1234",
    name: "Career Bridge Demo Employer"
  }
];

const employees = [
  {
    email: "employee@careerbridge.com",
    password: "demo1234",
    name: "Career Bridge Demo Employee"
  }
];

const jobs = [
  {
    id: 1,
    title: "Junior Frontend Developer",
    company: "Dhaka Tech Hub",
    location: "Dhaka",
    type: "Full-time",
    salary: "BDT 35,000 - 45,000",
    description: "Build and maintain responsive interfaces using modern JavaScript and component-based UI patterns.",
    requirements: [
      "Strong HTML, CSS, JavaScript fundamentals",
      "Basic React or Vue knowledge",
      "Familiar with Git workflow"
    ],
    employerEmail: "employer@careerbridge.com",
    employerKey: "demo1234",
    postedAt: "2026-04-16T10:00:00.000Z"
  },
  {
    id: 2,
    title: "Backend Node.js Developer",
    company: "BridgeStack",
    location: "Dhaka",
    type: "Hybrid",
    salary: "BDT 55,000 - 80,000",
    description: "Design REST APIs, integrate databases, and improve backend reliability and performance.",
    requirements: [
      "Node.js and Express experience",
      "SQL or NoSQL database understanding",
      "API authentication basics"
    ],
    employerEmail: "employer@careerbridge.com",
    employerKey: "demo1234",
    postedAt: "2026-04-15T09:00:00.000Z"
  },
  {
    id: 3,
    title: "Data Analyst",
    company: "Insight Grid",
    location: "Dhaka",
    type: "Full-time",
    salary: "BDT 45,000 - 70,000",
    description: "Analyze business datasets, prepare dashboards, and communicate trends to stakeholders.",
    requirements: [
      "Strong Excel and SQL",
      "Experience with BI dashboards",
      "Clear communication skills"
    ],
    employerEmail: "employer@careerbridge.com",
    employerKey: "demo1234",
    postedAt: "2026-04-14T11:00:00.000Z"
  }
];

const applications = [];

function getNextId(collection) {
  if (collection.length === 0) {
    return 1;
  }

  return Math.max(...collection.map((item) => item.id)) + 1;
}

function listSalaries() {
  return [...salaries];
}

function listJobs() {
  return [...jobs].sort((a, b) => b.id - a.id);
}

function findJobById(jobId) {
  return jobs.find((job) => job.id === jobId) || null;
}

function normalizeEmployerEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function registerEmployerIfMissing(employerEmail, employerKey) {
  const normalizedEmail = normalizeEmployerEmail(employerEmail);
  const normalizedKey = String(employerKey || "").trim();

  if (!normalizedEmail || !normalizedKey) {
    return;
  }

  const existing = employers.find((employer) => (
    normalizeEmployerEmail(employer.email) === normalizedEmail
    && String(employer.key || "").trim() === normalizedKey
  ));

  if (!existing) {
    employers.push({
      email: normalizedEmail,
      key: normalizedKey,
      name: "Career Bridge Employer"
    });
  }
}

function isEmployerCredentialsValid(employerEmail, employerKey) {
  const normalizedEmail = normalizeEmployerEmail(employerEmail);
  const inputKey = String(employerKey || "").trim();

  if (!normalizedEmail || !inputKey) {
    return false;
  }

  const hasRegisteredEmployer = employers.some((employer) => (
    normalizeEmployerEmail(employer.email) === normalizedEmail
    && String(employer.key || "").trim() === inputKey
  ));

  if (hasRegisteredEmployer) {
    return true;
  }

  return jobs.some((job) => (
    normalizeEmployerEmail(job.employerEmail) === normalizedEmail
    && String(job.employerKey || "").trim() === inputKey
  ));
}

function getEmployerProfileByCredentials(employerEmail, employerKey) {
  const normalizedEmail = normalizeEmployerEmail(employerEmail);
  const inputKey = String(employerKey || "").trim();

  if (!normalizedEmail || !inputKey) {
    return null;
  }

  const directEmployer = employers.find((employer) => (
    normalizeEmployerEmail(employer.email) === normalizedEmail
    && String(employer.key || "").trim() === inputKey
  ));

  if (directEmployer) {
    return {
      email: normalizeEmployerEmail(directEmployer.email),
      name: String(directEmployer.name || "Career Bridge Employer")
    };
  }

  const ownedJob = jobs.find((job) => (
    normalizeEmployerEmail(job.employerEmail) === normalizedEmail
    && String(job.employerKey || "").trim() === inputKey
  ));

  if (!ownedJob) {
    return null;
  }

  return {
    email: normalizedEmail,
    name: "Career Bridge Employer"
  };
}

function isEmployeeCredentialsValid(employeeEmail, employeePassword) {
  const normalizedEmail = normalizeEmployerEmail(employeeEmail);
  const inputPassword = String(employeePassword || "").trim();

  if (!normalizedEmail || !inputPassword) {
    return false;
  }

  return employees.some((employee) => (
    normalizeEmployerEmail(employee.email) === normalizedEmail
    && String(employee.password || "").trim() === inputPassword
  ));
}

function getEmployeeProfileByCredentials(employeeEmail, employeePassword) {
  const normalizedEmail = normalizeEmployerEmail(employeeEmail);
  const inputPassword = String(employeePassword || "").trim();

  if (!normalizedEmail || !inputPassword) {
    return null;
  }

  const employee = employees.find((item) => (
    normalizeEmployerEmail(item.email) === normalizedEmail
    && String(item.password || "").trim() === inputPassword
  ));

  if (!employee) {
    return null;
  }

  return {
    email: normalizedEmail,
    name: String(employee.name || "Career Bridge Employee")
  };
}

function isEmployerAuthorizedForJob(jobId, employerEmail, employerKey) {
  const job = findJobById(jobId);

  if (!job) {
    return false;
  }

  const normalizedInputEmail = normalizeEmployerEmail(employerEmail);
  const normalizedOwnerEmail = normalizeEmployerEmail(job.employerEmail);
  const inputKey = String(employerKey || "").trim();

  return Boolean(normalizedInputEmail && inputKey)
    && normalizedOwnerEmail === normalizedInputEmail
    && job.employerKey === inputKey;
}

function addJob(payload) {
  registerEmployerIfMissing(payload.employerEmail, payload.employerKey);

  const job = {
    id: getNextId(jobs),
    title: payload.title,
    company: payload.company,
    location: payload.location || "Unknown",
    type: payload.type || "Not specified",
    salary: payload.salary || "Not specified",
    description: payload.description || "No description provided yet.",
    requirements: Array.isArray(payload.requirements) ? payload.requirements : [],
    employerEmail: normalizeEmployerEmail(payload.employerEmail),
    employerKey: String(payload.employerKey || "").trim(),
    postedAt: new Date().toISOString()
  };

  jobs.push(job);
  return job;
}

function removeJobById(jobId) {
  const index = jobs.findIndex((job) => job.id === jobId);
  if (index === -1) {
    return null;
  }

  const [removed] = jobs.splice(index, 1);
  return removed;
}

function removeApplicationsByJobId(jobId) {
  const removedApplications = [];

  for (let index = applications.length - 1; index >= 0; index -= 1) {
    if (applications[index].jobId === jobId) {
      const [removed] = applications.splice(index, 1);
      removedApplications.push(removed);
    }
  }

  return removedApplications;
}

function listApplications(filter = {}) {
  const items = [...applications].sort((a, b) => b.id - a.id);

  if (!filter.jobId) {
    return items;
  }

  return items.filter((application) => application.jobId === filter.jobId);
}

function findApplicationById(applicationId) {
  return applications.find((application) => application.id === applicationId) || null;
}

function addApplication(payload) {
  const application = {
    id: getNextId(applications),
    jobId: payload.jobId,
    applicantName: payload.applicantName,
    applicantEmail: payload.applicantEmail,
    applicantPhone: payload.applicantPhone || "",
    cvFileName: payload.cvFileName || "",
    cvOriginalName: payload.cvOriginalName || "",
    coverLetter: payload.coverLetter || "",
    createdAt: new Date().toISOString()
  };

  applications.push(application);
  return application;
}

module.exports = {
  addApplication,
  addJob,
  findApplicationById,
  findJobById,
  getEmployeeProfileByCredentials,
  getEmployerProfileByCredentials,
  isEmployeeCredentialsValid,
  isEmployerCredentialsValid,
  isEmployerAuthorizedForJob,
  listApplications,
  listJobs,
  listSalaries,
  removeApplicationsByJobId,
  removeJobById
};
