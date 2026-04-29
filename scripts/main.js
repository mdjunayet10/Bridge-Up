const configuredApiBase = document
  .querySelector("meta[name='career-bridge-api-base']")
  ?.getAttribute("content");

const API_BASE = String(configuredApiBase || "").trim()
  || (window.location.protocol === "file:" ? "http://localhost:4000" : "");
const REQUEST_TIMEOUT_MS = 12_000;

const fallbackSalaries = [
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
  }
];

const fallbackJobs = [
  {
    id: 1,
    title: "Junior Frontend Developer",
    company: "Dhaka Tech Hub",
    location: "Dhaka",
    type: "Full-time",
    salary: "BDT 35,000 - 45,000",
    description: "Build and maintain responsive interfaces with modern JavaScript.",
    requirements: ["HTML, CSS, JavaScript", "Git basics"],
    employerEmail: "employer@careerbridge.com",
    employerKey: "demo1234"
  },
  {
    id: 2,
    title: "Backend Node.js Developer",
    company: "BridgeStack",
    location: "Dhaka",
    type: "Hybrid",
    salary: "BDT 55,000 - 80,000",
    description: "Create scalable APIs and optimize backend services.",
    requirements: ["Node.js + Express", "Database knowledge"],
    employerEmail: "employer@careerbridge.com",
    employerKey: "demo1234"
  },
  {
    id: 3,
    title: "Data Analyst",
    company: "Insight Grid",
    location: "Dhaka",
    type: "Full-time",
    salary: "BDT 45,000 - 70,000",
    description: "Analyze datasets and convert findings into business insights.",
    requirements: ["SQL and Excel", "Dashboard reporting"],
    employerEmail: "employer@careerbridge.com",
    employerKey: "demo1234"
  }
];

const fallbackEmployeeAccount = {
  email: "employee@careerbridge.com",
  password: "demo1234",
  displayName: "Career Bridge Demo Employee"
};

const state = {
  apiOnline: false,
  currentKeyword: "",
  salaries: [...fallbackSalaries],
  jobs: [...fallbackJobs],
  applications: [],
  managedJobIds: new Set(),
  employeeSession: {
    employeeEmail: "",
    displayName: "",
    accessToken: "",
    tokenExpiresAt: ""
  },
  employerSession: {
    employerEmail: "",
    employerKey: "",
    accessToken: "",
    tokenExpiresAt: ""
  },
  authModalRole: "employee",
  cvPreview: {
    objectUrl: "",
    fileName: "",
    requestId: 0,
    returnFocus: null
  }
};

const elements = {
  apiStatus: document.querySelector("#apiStatus"),
  apiHint: document.querySelector("#apiHint"),
  salaryGrid: document.querySelector("#salaryGrid"),
  jobList: document.querySelector("#jobList"),
  jobCount: document.querySelector("#jobCount"),
  jobSearch: document.querySelector("#jobSearch"),
  filterChips: document.querySelector("#filterChips"),
  listingGrid: document.querySelector("#listingGrid"),
  applicationList: document.querySelector("#applicationList"),
  authQuickStatus: document.querySelector("#authQuickStatus"),
  openAuthModalButton: document.querySelector("#openAuthModalButton"),
  openAuthModalButtonLabel: document.querySelector("#openAuthModalButtonLabel"),
  authModal: document.querySelector("#authModal"),
  closeAuthModalButton: document.querySelector("#closeAuthModalButton"),
  authModalBackdrop: document.querySelector("[data-close-auth-modal]"),
  employeeAuthTab: document.querySelector("#employeeAuthTab"),
  employerAuthTab: document.querySelector("#employerAuthTab"),
  employeeAuthPanel: document.querySelector("#employeeAuthPanel"),
  employerAuthPanel: document.querySelector("#employerAuthPanel"),
  employeeAuthForm: document.querySelector("#employeeAuthForm"),
  employeeEmail: document.querySelector("#employeeEmail"),
  employeePassword: document.querySelector("#employeePassword"),
  employeeLogoutButton: document.querySelector("#employeeLogoutButton"),
  employeeAuthStatus: document.querySelector("#employeeAuthStatus"),
  employerAuthForm: document.querySelector("#employerAuthForm"),
  employerEmail: document.querySelector("#employerEmail"),
  employerKey: document.querySelector("#employerKey"),
  employerLogoutButton: document.querySelector("#employerLogoutButton"),
  employerAuthStatus: document.querySelector("#employerAuthStatus"),
  postJobForm: document.querySelector("#postJobForm"),
  postJobStatus: document.querySelector("#postJobStatus"),
  applyForm: document.querySelector("#applyForm"),
  applyName: document.querySelector("#applyName"),
  applyEmail: document.querySelector("#applyEmail"),
  applyStatus: document.querySelector("#applyStatus"),
  applyJobId: document.querySelector("#applyJobId"),
  jobDetailPanel: document.querySelector("#jobDetailPanel"),
  jobModal: document.querySelector("#jobModal"),
  closeModalButton: document.querySelector("#closeModalButton"),
  modalBackdrop: document.querySelector("[data-close-modal]"),
  cvModal: document.querySelector("#cvModal"),
  closeCvModalButton: document.querySelector("#closeCvModalButton"),
  cvModalBackdrop: document.querySelector("[data-close-cv-modal]"),
  cvPreviewFrame: document.querySelector("#cvPreviewFrame"),
  cvModalStatus: document.querySelector("#cvModalStatus"),
  downloadCvButton: document.querySelector("#downloadCvButton"),
  menuButton: document.querySelector("#menuButton"),
  siteNav: document.querySelector("#siteNav")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeEmployerEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmployeeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function hasEmployeeSession() {
  return Boolean(
    state.employeeSession.accessToken
    || state.employeeSession.employeeEmail
  );
}

function hasEmployeeToken() {
  return Boolean(state.employeeSession.accessToken);
}

function getEmployeeAuthHeaders() {
  if (!hasEmployeeToken()) {
    return {};
  }

  return {
    authorization: `Bearer ${state.employeeSession.accessToken}`
  };
}

function setEmployeeSession(employeeEmail, accessToken = "", tokenExpiresAt = "", displayName = "") {
  state.employeeSession = {
    employeeEmail: normalizeEmployeeEmail(employeeEmail),
    displayName: String(displayName || "").trim(),
    accessToken: String(accessToken || "").trim(),
    tokenExpiresAt: String(tokenExpiresAt || "").trim()
  };

  if (elements.employeeEmail) {
    elements.employeeEmail.value = state.employeeSession.employeeEmail;
  }

  const persistedValue = JSON.stringify(state.employeeSession);
  window.localStorage.setItem("careerBridgeEmployeeSession", persistedValue);

  syncEmployeeAuthControls();
  applyEmployeeSessionToForm();
}

function loadEmployeeSession() {
  const rawValue = window.localStorage.getItem("careerBridgeEmployeeSession");

  if (!rawValue) {
    setEmployeeSession("", "", "", "");
    return;
  }

  try {
    const parsed = JSON.parse(rawValue);
    setEmployeeSession(
      parsed.employeeEmail,
      parsed.accessToken,
      parsed.tokenExpiresAt,
      parsed.displayName
    );
  } catch (_error) {
    setEmployeeSession("", "", "", "");
  }
}

function clearEmployeeSession() {
  setEmployeeSession("", "", "", "");
}

function syncEmployeeAuthControls() {
  if (!elements.employeeLogoutButton) {
    syncHeaderAuthControls();
    return;
  }

  elements.employeeLogoutButton.disabled = !hasEmployeeSession();
  syncHeaderAuthControls();
}

function applyEmployeeSessionToForm() {
  if (elements.applyEmail && hasEmployeeSession()) {
    elements.applyEmail.value = state.employeeSession.employeeEmail;
  }
}

function hasEmployerSession() {
  return Boolean(
    state.employerSession.accessToken
    || (
      state.employerSession.employerEmail
      && state.employerSession.employerKey
    )
  );
}

function hasEmployerToken() {
  return Boolean(state.employerSession.accessToken);
}

function getEmployerAuthHeaders() {
  if (hasEmployerToken()) {
    return {
      authorization: `Bearer ${state.employerSession.accessToken}`
    };
  }

  if (!hasEmployerSession()) {
    return {};
  }

  return {
    "x-employer-email": state.employerSession.employerEmail,
    "x-employer-key": state.employerSession.employerKey
  };
}

function setEmployerSession(employerEmail, employerKey, accessToken = "", tokenExpiresAt = "") {
  state.employerSession = {
    employerEmail: normalizeEmployerEmail(employerEmail),
    employerKey: String(employerKey || "").trim(),
    accessToken: String(accessToken || "").trim(),
    tokenExpiresAt: String(tokenExpiresAt || "").trim()
  };

  if (elements.employerEmail) {
    elements.employerEmail.value = state.employerSession.employerEmail;
  }

  if (elements.employerKey) {
    elements.employerKey.value = state.employerSession.employerKey;
  }

  const persistedValue = JSON.stringify(state.employerSession);
  window.localStorage.setItem("careerBridgeEmployerSession", persistedValue);
  syncEmployerAuthControls();
}

function syncEmployerAuthControls() {
  if (!elements.employerLogoutButton) {
    syncHeaderAuthControls();
    return;
  }

  elements.employerLogoutButton.disabled = !hasEmployerSession();
  syncHeaderAuthControls();
}

function getHeaderAuthSummaryText() {
  const hasEmployee = hasEmployeeSession();
  const hasEmployer = hasEmployerSession();

  if (hasEmployee && hasEmployer) {
    return "Employee + Employer signed in";
  }

  if (hasEmployer) {
    return "Employer signed in";
  }

  if (hasEmployee) {
    return "Employee signed in";
  }

  return "Not signed in";
}

function syncHeaderAuthControls() {
  if (elements.authQuickStatus) {
    elements.authQuickStatus.textContent = getHeaderAuthSummaryText();
  }

  if (elements.openAuthModalButtonLabel) {
    const hasAnySession = hasEmployeeSession() || hasEmployerSession();
    elements.openAuthModalButtonLabel.textContent = hasAnySession ? "Account" : "Login";
  }

  if (elements.openAuthModalButton) {
    const hasAnySession = hasEmployeeSession() || hasEmployerSession();
    elements.openAuthModalButton.classList.toggle("active", hasAnySession);
  }
}

function loadEmployerSession() {
  const rawValue = window.localStorage.getItem("careerBridgeEmployerSession");

  if (!rawValue) {
    setEmployerSession("", "");
    return;
  }

  try {
    const parsed = JSON.parse(rawValue);
    setEmployerSession(
      parsed.employerEmail,
      parsed.employerKey,
      parsed.accessToken,
      parsed.tokenExpiresAt
    );
  } catch (_error) {
    setEmployerSession("", "", "", "");
  }
}

function clearEmployerSession() {
  setEmployerSession("", "", "", "");
}

function normalizeRequirements(requirements) {
  if (Array.isArray(requirements)) {
    return requirements.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof requirements !== "string") {
    return [];
  }

  return requirements
    .split(/\n|,/) 
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function truncateText(value, maxLength = 120) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function getInitials(value) {
  return String(value || "CB")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CB";
}

async function requestJson(path, options = {}) {
  const response = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const requestError = new Error(payload.message || "Request failed");
    requestError.status = response.status;
    throw requestError;
  }

  return payload;
}

async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function setApiStatus(online, message = "") {
  if (!elements.apiStatus || !elements.apiHint) {
    return;
  }

  elements.apiStatus.classList.remove("online", "offline");

  if (online) {
    elements.apiStatus.classList.add("online");
    elements.apiStatus.textContent = "Backend connected";
    elements.apiHint.textContent = "Live API mode is active.";
    return;
  }

  elements.apiStatus.classList.add("offline");
  elements.apiStatus.textContent = "Offline demo mode";
  elements.apiHint.textContent = message || "Start backend at localhost:4000 for full mode.";
}

function createSalaryCard(item) {
  const trendLabel = item.trend || "Market signal";
  const trendIcon = /high|growing/i.test(trendLabel)
    ? "fa-arrow-trend-up"
    : "fa-chart-simple";

  return `
    <article class="card salary-card">
      <div class="salary-card-top">
        <div>
          <p class="eyebrow">Compensation</p>
          <h3>${escapeHtml(item.role)}</h3>
        </div>
        <span class="icon-bubble"><i class="fa-solid ${trendIcon}" aria-hidden="true"></i></span>
      </div>
      <p class="salary-value">${escapeHtml(item.salaryRange)}</p>
      <p>${escapeHtml(item.level || "Role benchmark")}</p>
      <span class="badge success">${escapeHtml(trendLabel)}</span>
    </article>
  `;
}

function createJobCard(job) {
  const requirements = normalizeRequirements(job.requirements);
  const requirementPreview = requirements.length
    ? truncateText(requirements.slice(0, 2).join(" • "), 120)
    : "Requirements will be shared by the employer.";

  return `
    <article class="job-card">
      <div class="job-card-top">
        <div>
          <h3>${escapeHtml(job.title)}</h3>
          <p><strong>${escapeHtml(job.company)}</strong></p>
        </div>
        <span class="icon-bubble" aria-hidden="true">${escapeHtml(getInitials(job.company))}</span>
      </div>
      <div class="job-meta-list">
        <span class="meta-pill"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(job.location || "Bangladesh")}</span>
        <span class="meta-pill"><i class="fa-solid fa-briefcase" aria-hidden="true"></i>${escapeHtml(job.type || "Not specified")}</span>
        <span class="meta-pill"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${escapeHtml(formatDate(job.postedAt))}</span>
      </div>
      <p class="job-salary">${escapeHtml(job.salary || "Salary negotiable")}</p>
      <p class="requirements-preview">${escapeHtml(requirementPreview)}</p>
      <div class="job-actions">
        <button class="btn-action" type="button" data-action="details" data-id="${job.id}">
          <i class="fa-regular fa-eye" aria-hidden="true"></i>Details
        </button>
        <button class="btn-action strong" type="button" data-action="apply" data-id="${job.id}">
          <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>Apply
        </button>
      </div>
    </article>
  `;
}

function createListingItem(job) {
  return `
    <article class="listing-item">
      <div class="listing-top">
        <div>
          <h3>${escapeHtml(job.title)}</h3>
          <p>${escapeHtml(job.company)} | ${escapeHtml(job.location)} | ${escapeHtml(job.type)}</p>
        </div>
        <span class="badge">Live</span>
      </div>
      <p>${escapeHtml(job.salary)}</p>
      <div class="listing-actions">
        <button class="btn-action danger" type="button" data-action="delete-job" data-id="${job.id}">
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>Remove
        </button>
      </div>
    </article>
  `;
}

function createApplicationItem(application) {
  const job = state.jobs.find((item) => item.id === application.jobId);
  const roleLabel = job ? `${job.title} (${job.company})` : `Job #${application.jobId}`;
  const hasLocalBlob = Boolean(application.cvUrl && String(application.cvUrl).startsWith("blob:"));
  const canViewCv = Boolean(application.canViewCv || hasLocalBlob);
  const coverPreview = truncateText(application.coverLetter || "No cover letter provided.", 150);
  const cvActionMarkup = canViewCv
    ? `
      <div class="application-actions">
        <button class="btn-action cv-link" type="button" data-action="view-cv" data-id="${application.id}">
          <i class="fa-regular fa-file-lines" aria-hidden="true"></i>Preview CV
        </button>
        <button class="btn-action" type="button" data-action="download-cv" data-id="${application.id}">
          <i class="fa-solid fa-download" aria-hidden="true"></i>Download
        </button>
      </div>
    `
    : "<p>CV hidden. Sign in as the job owner to view.</p>";

  return `
    <article class="application-item">
      <div class="application-top">
        <div>
          <h3>${escapeHtml(application.applicantName)}</h3>
          <p><strong>${escapeHtml(roleLabel)}</strong></p>
        </div>
        <span class="badge">Submitted ${escapeHtml(formatDate(application.createdAt))}</span>
      </div>
      <div class="application-contact">
        <span class="meta-pill"><i class="fa-regular fa-envelope" aria-hidden="true"></i>${escapeHtml(application.applicantEmail)}</span>
        ${application.applicantPhone ? `<span class="meta-pill"><i class="fa-solid fa-phone" aria-hidden="true"></i>${escapeHtml(application.applicantPhone)}</span>` : ""}
      </div>
      <p class="cover-preview">${escapeHtml(coverPreview)}</p>
      ${cvActionMarkup}
    </article>
  `;
}

function getSafeFileName(value, fallback = "cv-file") {
  const source = String(value || fallback).trim();
  const sanitized = source.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
  return sanitized || fallback;
}

function parseFileNameFromDisposition(dispositionValue) {
  if (!dispositionValue) {
    return "";
  }

  const utfMatch = dispositionValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch && utfMatch[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const basicMatch = dispositionValue.match(/filename="?([^";]+)"?/i);
  if (basicMatch && basicMatch[1]) {
    return basicMatch[1];
  }

  return "";
}

function triggerFileDownload(fileUrl, fileName) {
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = getSafeFileName(fileName);
  link.rel = "noopener noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}

function isPreviewableCvFile(mimeType, fileName) {
  const normalizedMime = String(mimeType || "").toLowerCase();
  if (normalizedMime.includes("pdf")) {
    return true;
  }

  const normalizedName = String(fileName || "").toLowerCase();
  return normalizedName.endsWith(".pdf");
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "[tabindex]:not([tabindex='-1'])"
  ];

  return Array.from(container.querySelectorAll(selectors.join(","))).filter((element) => {
    if (!(element instanceof HTMLElement) && !(element instanceof HTMLIFrameElement)) {
      return false;
    }

    const ariaHidden = element.getAttribute("aria-hidden") === "true";
    const hiddenByStyle = window.getComputedStyle(element).display === "none";
    return !ariaHidden && !hiddenByStyle;
  });
}

function trapFocusInModal(modalElement, event) {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(modalElement);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !modalElement.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last || !modalElement.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

function setCvReturnFocus(targetElement) {
  if (targetElement instanceof HTMLElement) {
    state.cvPreview.returnFocus = targetElement;
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    state.cvPreview.returnFocus = document.activeElement;
    return;
  }

  state.cvPreview.returnFocus = null;
}

function focusCvModalPrimaryAction() {
  if (!elements.cvModal || elements.cvModal.hidden) {
    return;
  }

  const focusable = getFocusableElements(elements.cvModal);
  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

function renderSalaryCards() {
  if (!elements.salaryGrid) {
    return;
  }

  elements.salaryGrid.innerHTML = state.salaries.map(createSalaryCard).join("");
}

function getFilteredJobs() {
  const value = state.currentKeyword.trim().toLowerCase();

  if (!value) {
    return [...state.jobs];
  }

  return state.jobs.filter((job) => {
    const combined = `${job.title} ${job.company} ${job.location}`.toLowerCase();
    return combined.includes(value);
  });
}

function renderJobCards() {
  if (!elements.jobList) {
    return;
  }

  const filteredJobs = getFilteredJobs();

  if (elements.jobCount) {
    elements.jobCount.textContent = String(filteredJobs.length);
  }

  if (filteredJobs.length === 0) {
    elements.jobList.innerHTML = `
      <article class="empty-state">
        <span class="icon-bubble"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span>
        <h3>No result found</h3>
        <p>Try another keyword like role, company, or city.</p>
      </article>
    `;
    return;
  }

  elements.jobList.innerHTML = filteredJobs.map(createJobCard).join("");
}

function getManagedJobs() {
  if (!hasEmployerSession()) {
    return [];
  }

  if (state.apiOnline) {
    return state.jobs.filter((job) => state.managedJobIds.has(job.id));
  }

  return state.jobs.filter((job) => {
    const ownerEmail = normalizeEmployerEmail(job.employerEmail);
    const ownerKey = String(job.employerKey || "").trim();

    return ownerEmail === state.employerSession.employerEmail
      && ownerKey === state.employerSession.employerKey;
  });
}

function renderListings() {
  if (!elements.listingGrid) {
    return;
  }

  if (!hasEmployerSession()) {
    elements.listingGrid.innerHTML = `
      <article class="empty-state">
        <p>Sign in with employer email and access key to manage listings.</p>
      </article>
    `;
    return;
  }

  const managedJobs = getManagedJobs();

  if (managedJobs.length === 0) {
    elements.listingGrid.innerHTML = `
      <article class="empty-state">
        <p>No active job listings found for this employer account.</p>
      </article>
    `;
    return;
  }

  elements.listingGrid.innerHTML = managedJobs.map(createListingItem).join("");
}

function renderApplications() {
  if (!elements.applicationList) {
    return;
  }

  if (!hasEmployerSession()) {
    elements.applicationList.innerHTML = `
      <article class="empty-state">
        <p>Sign in as employer to view applications and CV files.</p>
      </article>
    `;
    return;
  }

  if (state.applications.length === 0) {
    elements.applicationList.innerHTML = `
      <article class="empty-state">
        <p>No applications found for this employer account.</p>
      </article>
    `;
    return;
  }

  elements.applicationList.innerHTML = state.applications
    .slice(0, 12)
    .map(createApplicationItem)
    .join("");
}

function setFormStatus(element, message, tone = "") {
  if (!element) {
    return;
  }

  element.classList.remove("success", "error");
  element.textContent = message;

  if (tone) {
    element.classList.add(tone);
  }
}

function syncModalOpenState() {
  const isJobModalOpen = Boolean(elements.jobModal && !elements.jobModal.hidden);
  const isCvModalOpen = Boolean(elements.cvModal && !elements.cvModal.hidden);
  const isAuthModalOpen = Boolean(elements.authModal && !elements.authModal.hidden);
  document.body.classList.toggle("modal-open", isJobModalOpen || isCvModalOpen || isAuthModalOpen);
}

function setAuthModalRole(role) {
  const nextRole = role === "employer" ? "employer" : "employee";
  state.authModalRole = nextRole;

  const isEmployee = nextRole === "employee";

  if (elements.employeeAuthPanel) {
    elements.employeeAuthPanel.hidden = !isEmployee;
  }

  if (elements.employerAuthPanel) {
    elements.employerAuthPanel.hidden = isEmployee;
  }

  if (elements.employeeAuthTab) {
    elements.employeeAuthTab.classList.toggle("active", isEmployee);
    elements.employeeAuthTab.setAttribute("aria-selected", String(isEmployee));
  }

  if (elements.employerAuthTab) {
    elements.employerAuthTab.classList.toggle("active", !isEmployee);
    elements.employerAuthTab.setAttribute("aria-selected", String(!isEmployee));
  }
}

function openAuthModal(preferredRole = "") {
  if (!elements.authModal) {
    return;
  }

  const roleFromSession = hasEmployerSession()
    ? "employer"
    : (hasEmployeeSession() ? "employee" : "");

  const targetRole = preferredRole || roleFromSession || state.authModalRole || "employee";
  setAuthModalRole(targetRole);

  elements.authModal.hidden = false;
  syncModalOpenState();

  requestAnimationFrame(() => {
    const focusTarget = targetRole === "employer"
      ? elements.employerEmail
      : elements.employeeEmail;

    if (focusTarget) {
      focusTarget.focus();
    }
  });
}

function closeAuthModal() {
  if (!elements.authModal) {
    return;
  }

  elements.authModal.hidden = true;
  syncModalOpenState();
}

function clearCvPreviewState() {
  if (state.cvPreview.objectUrl) {
    URL.revokeObjectURL(state.cvPreview.objectUrl);
  }

  state.cvPreview.objectUrl = "";
  state.cvPreview.fileName = "";

  if (elements.cvPreviewFrame) {
    elements.cvPreviewFrame.removeAttribute("src");
  }

  if (elements.downloadCvButton) {
    elements.downloadCvButton.dataset.fileUrl = "";
    elements.downloadCvButton.dataset.fileName = "";
    elements.downloadCvButton.disabled = true;
  }
}

function showCvPreviewLoading(triggerElement) {
  if (!elements.cvModal) {
    return 0;
  }

  setCvReturnFocus(triggerElement);
  clearCvPreviewState();
  state.cvPreview.requestId += 1;
  const requestId = state.cvPreview.requestId;

  setFormStatus(elements.cvModalStatus, "Loading CV preview...", "");
  elements.cvModal.hidden = false;
  syncModalOpenState();
  focusCvModalPrimaryAction();

  return requestId;
}

function openCvModal(options) {
  if (!elements.cvModal || !elements.cvPreviewFrame || !elements.downloadCvButton) {
    return;
  }

  const {
    fileUrl,
    fileName,
    mimeType,
    revokeOnClose
  } = options;

  clearCvPreviewState();

  if (revokeOnClose) {
    state.cvPreview.objectUrl = fileUrl;
  }

  state.cvPreview.fileName = getSafeFileName(fileName || "cv-file");
  const canPreview = isPreviewableCvFile(mimeType, state.cvPreview.fileName);

  if (canPreview) {
    elements.cvPreviewFrame.src = fileUrl;
  } else {
    elements.cvPreviewFrame.removeAttribute("src");
  }

  elements.downloadCvButton.dataset.fileUrl = fileUrl;
  elements.downloadCvButton.dataset.fileName = state.cvPreview.fileName;
  elements.downloadCvButton.disabled = false;

  setFormStatus(
    elements.cvModalStatus,
    canPreview
      ? "CV preview ready."
      : "This CV format is not previewable in-browser. Use Download CV to open it locally.",
    ""
  );

  elements.cvModal.hidden = false;
  syncModalOpenState();
  focusCvModalPrimaryAction();
}

function closeCvModal() {
  if (!elements.cvModal) {
    return;
  }

  const returnFocusTarget = state.cvPreview.returnFocus;
  elements.cvModal.hidden = true;
  state.cvPreview.requestId += 1;
  clearCvPreviewState();
  setFormStatus(elements.cvModalStatus, "", "");
  state.cvPreview.returnFocus = null;
  syncModalOpenState();

  if (returnFocusTarget instanceof HTMLElement && document.contains(returnFocusTarget)) {
    returnFocusTarget.focus();
  }
}

async function fetchProtectedCvBlob(applicationId) {
  const response = await fetchWithTimeout(`${API_BASE}/api/applications/${applicationId}/cv`, {
    headers: {
      ...getEmployerAuthHeaders()
    }
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message || "Could not open CV file.");
  }

  const fileBlob = await response.blob();
  const fileName = getSafeFileName(
    parseFileNameFromDisposition(response.headers.get("content-disposition")),
    `application-${applicationId}-cv`
  );

  return {
    fileBlob,
    fileName,
    mimeType: fileBlob.type || response.headers.get("content-type") || ""
  };
}

function openJobModal(job, focusForm = false) {
  if (!elements.jobModal || !elements.jobDetailPanel || !elements.applyJobId) {
    return;
  }

  const requirements = normalizeRequirements(job.requirements);
  const requirementsMarkup = requirements.length
    ? requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No specific requirements listed yet.</li>";

  elements.jobDetailPanel.innerHTML = `
    <h2 id="modalJobTitle">${escapeHtml(job.title)}</h2>
    <div class="job-meta-list">
      <span class="meta-pill"><i class="fa-solid fa-building" aria-hidden="true"></i>${escapeHtml(job.company)}</span>
      <span class="meta-pill"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(job.location)}</span>
      <span class="meta-pill"><i class="fa-solid fa-briefcase" aria-hidden="true"></i>${escapeHtml(job.type)}</span>
    </div>
    <p class="job-salary">${escapeHtml(job.salary)}</p>
    <p id="modalJobDescription">${escapeHtml(job.description || "No description provided yet.")}</p>
    <ul class="job-detail-list">${requirementsMarkup}</ul>
  `;

  elements.applyJobId.value = String(job.id);

  if (elements.applyEmail && hasEmployeeSession()) {
    elements.applyEmail.value = state.employeeSession.employeeEmail;
  }

  if (elements.applyName && !elements.applyName.value && state.employeeSession.displayName) {
    elements.applyName.value = state.employeeSession.displayName;
  }

  setFormStatus(elements.applyStatus, "");
  elements.jobModal.hidden = false;
  syncModalOpenState();

  if (focusForm) {
    requestAnimationFrame(() => {
      const nameInput = document.querySelector("#applyName");
      if (nameInput) {
        nameInput.focus();
      }
    });
  }
}

function closeJobModal() {
  if (!elements.jobModal) {
    return;
  }

  elements.jobModal.hidden = true;
  syncModalOpenState();
}

async function loadFromApi() {
  const [salaryResponse, jobResponse] = await Promise.all([
    requestJson("/api/salaries"),
    requestJson("/api/jobs")
  ]);

  state.salaries = Array.isArray(salaryResponse.data) ? salaryResponse.data : [...fallbackSalaries];
  state.jobs = Array.isArray(jobResponse.data) ? jobResponse.data : [...fallbackJobs];
  state.managedJobIds = new Set();
  state.applications = [];

  if (!hasEmployerSession()) {
    return;
  }

  const authHeaders = getEmployerAuthHeaders();
  const [managedJobResponse, applicationResponse] = await Promise.all([
    requestJson("/api/jobs", { headers: authHeaders }),
    requestJson("/api/applications", { headers: authHeaders })
  ]);

  const managedJobs = Array.isArray(managedJobResponse.data) ? managedJobResponse.data : [];
  state.managedJobIds = new Set(managedJobs.map((job) => job.id));
  state.applications = Array.isArray(applicationResponse.data) ? applicationResponse.data : [];
}

async function hydrateData() {
  try {
    await loadFromApi();
    state.apiOnline = true;
    setApiStatus(true);
  } catch (error) {
    if ((error.status === 401 || error.status === 403) && hasEmployerToken()) {
      clearEmployerSession();

      try {
        await loadFromApi();
        state.apiOnline = true;
        setApiStatus(true);
        setFormStatus(elements.employerAuthStatus, "Session expired. Please sign in again.", "error");
      } catch (_retryError) {
        state.apiOnline = false;
        state.salaries = [...fallbackSalaries];
        state.jobs = [...fallbackJobs];
        state.applications = [];
        state.managedJobIds = new Set();
        setApiStatus(false);
      }
    } else {
      state.apiOnline = false;
      state.salaries = [...fallbackSalaries];
      state.jobs = [...fallbackJobs];
      state.applications = [];
      state.managedJobIds = new Set();
      setApiStatus(false);
    }
  }

  renderSalaryCards();
  renderJobCards();
  renderListings();
  renderApplications();
}

function getJobById(jobId) {
  return state.jobs.find((job) => job.id === jobId) || null;
}

function setupMenu() {
  if (!elements.menuButton || !elements.siteNav) {
    return;
  }

  elements.menuButton.addEventListener("click", () => {
    const expanded = elements.menuButton.getAttribute("aria-expanded") === "true";
    elements.menuButton.setAttribute("aria-expanded", String(!expanded));
    elements.siteNav.classList.toggle("open", !expanded);
  });

  elements.siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      elements.menuButton.setAttribute("aria-expanded", "false");
      elements.siteNav.classList.remove("open");
    });
  });
}

function setupActiveNavigation() {
  const links = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (links.length === 0 || sections.length === 0 || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) {
        return;
      }

      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visibleEntry.target.id}`);
      });
    },
    {
      rootMargin: "-28% 0px -58% 0px",
      threshold: [0.08, 0.18, 0.32]
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupRevealAnimation() {
  const sections = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sections.forEach((section) => section.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupModalEvents() {
  if (elements.openAuthModalButton) {
    elements.openAuthModalButton.addEventListener("click", () => {
      openAuthModal();
    });
  }

  if (elements.closeAuthModalButton) {
    elements.closeAuthModalButton.addEventListener("click", closeAuthModal);
  }

  if (elements.authModalBackdrop) {
    elements.authModalBackdrop.addEventListener("click", closeAuthModal);
  }

  if (elements.employeeAuthTab) {
    elements.employeeAuthTab.addEventListener("click", () => {
      setAuthModalRole("employee");
      if (elements.employeeEmail) {
        elements.employeeEmail.focus();
      }
    });
  }

  if (elements.employerAuthTab) {
    elements.employerAuthTab.addEventListener("click", () => {
      setAuthModalRole("employer");
      if (elements.employerEmail) {
        elements.employerEmail.focus();
      }
    });
  }

  if (elements.closeModalButton) {
    elements.closeModalButton.addEventListener("click", closeJobModal);
  }

  if (elements.modalBackdrop) {
    elements.modalBackdrop.addEventListener("click", closeJobModal);
  }

  if (elements.closeCvModalButton) {
    elements.closeCvModalButton.addEventListener("click", closeCvModal);
  }

  if (elements.cvModalBackdrop) {
    elements.cvModalBackdrop.addEventListener("click", closeCvModal);
  }

  if (elements.downloadCvButton) {
    elements.downloadCvButton.addEventListener("click", () => {
      const fileUrl = elements.downloadCvButton.dataset.fileUrl;
      const fileName = elements.downloadCvButton.dataset.fileName || "cv-file";

      if (!fileUrl) {
        setFormStatus(elements.cvModalStatus, "CV file is not ready yet.", "error");
        return;
      }

      triggerFileDownload(fileUrl, fileName);
    });
  }

  document.addEventListener("keydown", (event) => {
    const activeModal = (elements.authModal && !elements.authModal.hidden)
      ? elements.authModal
      : ((elements.cvModal && !elements.cvModal.hidden)
        ? elements.cvModal
        : ((elements.jobModal && !elements.jobModal.hidden) ? elements.jobModal : null));

    if (!activeModal) {
      return;
    }

    if (event.key === "Tab") {
      trapFocusInModal(activeModal, event);
      return;
    }

    if (event.key === "Escape") {
      if (activeModal === elements.authModal) {
        closeAuthModal();
        return;
      }

      if (activeModal === elements.cvModal) {
        closeCvModal();
        return;
      }

      closeJobModal();
    }
  });
}

async function refreshJobsAndApplications() {
  if (!state.apiOnline) {
    renderJobCards();
    renderListings();
    renderApplications();
    return;
  }

  try {
    const jobResponse = await requestJson("/api/jobs");

    state.jobs = Array.isArray(jobResponse.data) ? jobResponse.data : [];
    state.managedJobIds = new Set();
    state.applications = [];

    if (hasEmployerSession()) {
      const authHeaders = getEmployerAuthHeaders();
      const [managedJobResponse, applicationResponse] = await Promise.all([
        requestJson("/api/jobs", { headers: authHeaders }),
        requestJson("/api/applications", { headers: authHeaders })
      ]);

      const managedJobs = Array.isArray(managedJobResponse.data) ? managedJobResponse.data : [];
      state.managedJobIds = new Set(managedJobs.map((job) => job.id));
      state.applications = Array.isArray(applicationResponse.data) ? applicationResponse.data : [];
    }
  } catch (error) {
    if ((error.status === 401 || error.status === 403) && hasEmployerToken()) {
      clearEmployerSession();
      setFormStatus(elements.employerAuthStatus, "Session expired. Please sign in again.", "error");

      try {
        const jobResponse = await requestJson("/api/jobs");
        state.jobs = Array.isArray(jobResponse.data) ? jobResponse.data : [];
        state.managedJobIds = new Set();
        state.applications = [];
        state.apiOnline = true;
        setApiStatus(true);
      } catch (_fallbackError) {
        setApiStatus(false, "Could not refresh data from backend.");
        state.apiOnline = false;
        state.managedJobIds = new Set();
        state.applications = [];
      }
    } else {
      setApiStatus(false, "Could not refresh data from backend.");
      state.apiOnline = false;
      state.managedJobIds = new Set();
      state.applications = [];
    }
  }

  renderJobCards();
  renderListings();
  renderApplications();
}

function setupJobSearch() {
  if (!elements.jobSearch) {
    return;
  }

  elements.jobSearch.addEventListener("input", (event) => {
    state.currentKeyword = event.target.value;
    if (elements.filterChips) {
      elements.filterChips.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", !event.target.value && chip.dataset.filter === "");
      });
    }
    renderJobCards();
  });

  if (elements.filterChips) {
    elements.filterChips.addEventListener("click", (event) => {
      const chip = event.target.closest(".filter-chip");

      if (!chip) {
        return;
      }

      const value = chip.dataset.filter || "";
      elements.jobSearch.value = value;
      state.currentKeyword = value;

      elements.filterChips.querySelectorAll(".filter-chip").forEach((item) => {
        item.classList.toggle("active", item === chip);
      });

      renderJobCards();
      elements.jobSearch.focus();
    });
  }
}

function setupJobActions() {
  if (!elements.jobList) {
    return;
  }

  elements.jobList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const jobId = Number.parseInt(button.dataset.id, 10);
    if (Number.isNaN(jobId)) {
      return;
    }

    const job = getJobById(jobId);
    if (!job) {
      return;
    }

    if (button.dataset.action === "details") {
      openJobModal(job);
      return;
    }

    if (button.dataset.action === "apply") {
      openJobModal(job, true);
    }
  });
}

function getNextLocalJobId() {
  if (state.jobs.length === 0) {
    return 1;
  }

  return Math.max(...state.jobs.map((job) => job.id || 0)) + 1;
}

function setupEmployeeAuthForm() {
  if (!elements.employeeAuthForm) {
    return;
  }

  elements.employeeAuthForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const employeeEmail = normalizeEmployeeEmail(elements.employeeEmail?.value || "");
    const employeePassword = String(elements.employeePassword?.value || "").trim();

    if (!employeeEmail || !employeePassword) {
      setFormStatus(elements.employeeAuthStatus, "Employee email and password are required.", "error");
      return;
    }

    setFormStatus(
      elements.employeeAuthStatus,
      state.apiOnline ? "Signing in as employee..." : "Preparing offline employee session...",
      ""
    );

    try {
      if (state.apiOnline) {
        const loginResponse = await requestJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            role: "employee",
            employeeEmail,
            employeePassword
          })
        });

        const loginData = loginResponse.data || {};
        setEmployeeSession(
          loginData.email || employeeEmail,
          loginData.accessToken,
          loginData.expiresAt,
          loginData.displayName || ""
        );
      } else {
        const isDemoLogin = (
          employeeEmail === fallbackEmployeeAccount.email
          && employeePassword === fallbackEmployeeAccount.password
        );

        if (!isDemoLogin) {
          throw new Error("Offline mode supports demo employee login only.");
        }

        setEmployeeSession(
          employeeEmail,
          "",
          "",
          fallbackEmployeeAccount.displayName
        );
      }

      if (elements.employeePassword) {
        elements.employeePassword.value = "";
      }

      setFormStatus(
        elements.employeeAuthStatus,
        state.apiOnline ? "Employee login successful." : "Offline employee session ready.",
        "success"
      );
      applyEmployeeSessionToForm();
      closeAuthModal();
    } catch (error) {
      setFormStatus(elements.employeeAuthStatus, error.message || "Could not sign in as employee.", "error");
    }
  });
}

function setupEmployeeLogoutAction() {
  if (!elements.employeeLogoutButton) {
    return;
  }

  elements.employeeLogoutButton.addEventListener("click", async () => {
    if (!hasEmployeeSession()) {
      return;
    }

    const authHeaders = getEmployeeAuthHeaders();

    if (state.apiOnline && hasEmployeeToken()) {
      try {
        await requestJson("/api/auth/logout", {
          method: "POST",
          headers: {
            ...authHeaders
          }
        });
      } catch (_error) {
        // Best effort: clear local session even if logout API fails.
      }
    }

    clearEmployeeSession();

    if (elements.employeePassword) {
      elements.employeePassword.value = "";
    }

    if (elements.applyEmail) {
      elements.applyEmail.value = "";
    }

    setFormStatus(elements.employeeAuthStatus, "Employee signed out.", "");
    closeAuthModal();
  });
}

function setupEmployerAuthForm() {
  if (!elements.employerAuthForm) {
    return;
  }

  elements.employerAuthForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const employerEmail = normalizeEmployerEmail(elements.employerEmail?.value || "");
    const employerKey = String(elements.employerKey?.value || "").trim();

    if (!employerEmail || !employerKey) {
      setFormStatus(elements.employerAuthStatus, "Employer email and access key are required.", "error");
      return;
    }

    setFormStatus(elements.employerAuthStatus, state.apiOnline ? "Signing in..." : "Preparing offline session...", "");

    try {
      if (state.apiOnline) {
        const loginResponse = await requestJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            role: "employer",
            employerEmail,
            employerKey
          })
        });

        const loginData = loginResponse.data || {};
        setEmployerSession(
          loginData.employerEmail || employerEmail,
          "",
          loginData.accessToken,
          loginData.expiresAt
        );
      } else {
        setEmployerSession(employerEmail, employerKey, "", "");
      }

      await refreshJobsAndApplications();
      setFormStatus(
        elements.employerAuthStatus,
        state.apiOnline ? "Login successful. Employer dashboard loaded." : "Offline session ready.",
        "success"
      );
      closeAuthModal();
    } catch (error) {
      setFormStatus(elements.employerAuthStatus, error.message || "Could not load employer dashboard.", "error");
    }
  });
}

function setupEmployerLogoutAction() {
  if (!elements.employerLogoutButton) {
    return;
  }

  elements.employerLogoutButton.addEventListener("click", async () => {
    if (!hasEmployerSession()) {
      return;
    }

    const authHeaders = getEmployerAuthHeaders();

    if (state.apiOnline && hasEmployerToken()) {
      try {
        await requestJson("/api/auth/logout", {
          method: "POST",
          headers: {
            ...authHeaders
          }
        });
      } catch (_error) {
        // Best effort: clear local session even if logout API fails.
      }
    }

    closeCvModal();
    closeAuthModal();
    clearEmployerSession();
    state.managedJobIds = new Set();
    state.applications = [];

    await refreshJobsAndApplications();
    setFormStatus(elements.employerAuthStatus, "Signed out. Sign in to access employer tools.", "");
  });
}

function setupApplicationActions() {
  if (!elements.applicationList) {
    return;
  }

  elements.applicationList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    if (action !== "view-cv" && action !== "download-cv") {
      return;
    }

    const applicationId = Number.parseInt(button.dataset.id, 10);
    if (Number.isNaN(applicationId)) {
      return;
    }

    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) {
      setFormStatus(elements.employerAuthStatus, "Application not found.", "error");
      return;
    }

    if (application.cvUrl && String(application.cvUrl).startsWith("blob:")) {
      const localFileName = getSafeFileName(application.cvOriginalName, `application-${application.id}-cv`);

      if (action === "download-cv") {
        triggerFileDownload(application.cvUrl, localFileName);
        return;
      }

      setCvReturnFocus(button);

      openCvModal({
        fileUrl: application.cvUrl,
        fileName: localFileName,
        mimeType: application.cvMimeType || "",
        revokeOnClose: false
      });
      return;
    }

    if (!state.apiOnline) {
      setFormStatus(elements.employerAuthStatus, "CV view requires backend live mode.", "error");
      return;
    }

    if (!hasEmployerSession()) {
      setFormStatus(elements.employerAuthStatus, "Sign in first to view CV files.", "error");
      openAuthModal("employer");
      return;
    }

    try {
      const previewRequestId = action === "view-cv" ? showCvPreviewLoading(button) : 0;
      const loadingMessage = action === "download-cv" ? "Preparing CV download..." : "Opening CV preview...";
      setFormStatus(elements.employerAuthStatus, loadingMessage, "");

      const {
        fileBlob,
        fileName,
        mimeType
      } = await fetchProtectedCvBlob(applicationId);
      const fileUrl = URL.createObjectURL(fileBlob);

      if (action === "download-cv") {
        triggerFileDownload(fileUrl, fileName);
        setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
        setFormStatus(elements.employerAuthStatus, "CV downloaded successfully.", "success");
        return;
      }

      if (previewRequestId !== state.cvPreview.requestId) {
        URL.revokeObjectURL(fileUrl);
        return;
      }

      openCvModal({
        fileUrl,
        fileName,
        mimeType,
        revokeOnClose: true
      });
      setFormStatus(elements.employerAuthStatus, "CV preview opened.", "success");
    } catch (error) {
      if (action === "view-cv" && elements.cvModal && !elements.cvModal.hidden) {
        setFormStatus(elements.cvModalStatus, error.message || "Could not open CV file.", "error");
      }
      setFormStatus(elements.employerAuthStatus, error.message || "Could not open CV file.", "error");
    }
  });
}

function setupPostJobForm() {
  if (!elements.postJobForm) {
    return;
  }

  elements.postJobForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus(elements.postJobStatus, "Posting job...");

    const formData = new FormData(elements.postJobForm);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      type: String(formData.get("type") || "").trim(),
      salary: String(formData.get("salary") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      requirements: String(formData.get("requirements") || "").trim()
    };

    if (!payload.title || !payload.company) {
      setFormStatus(elements.postJobStatus, "Job title and company are required.", "error");
      return;
    }

    if (!hasEmployerSession()) {
      setFormStatus(elements.postJobStatus, "Sign in with employer email and access key first.", "error");
      openAuthModal("employer");
      return;
    }

    try {
      if (state.apiOnline) {
        await requestJson("/api/jobs", {
          method: "POST",
          headers: {
            ...getEmployerAuthHeaders()
          },
          body: JSON.stringify({
            ...payload
          })
        });
      } else {
        const localJob = {
          id: getNextLocalJobId(),
          title: payload.title,
          company: payload.company,
          location: payload.location || "Unknown",
          type: payload.type || "Not specified",
          salary: payload.salary || "Not specified",
          description: payload.description || "No description provided yet.",
          requirements: normalizeRequirements(payload.requirements),
          employerEmail: state.employerSession.employerEmail,
          employerKey: state.employerSession.employerKey,
          postedAt: new Date().toISOString()
        };
        state.jobs = [localJob, ...state.jobs];
      }

      elements.postJobForm.reset();
      setFormStatus(elements.postJobStatus, "Job posted successfully.", "success");
      await refreshJobsAndApplications();
    } catch (error) {
      setFormStatus(elements.postJobStatus, error.message || "Could not post job.", "error");
    }
  });
}

function setupListingActions() {
  if (!elements.listingGrid) {
    return;
  }

  elements.listingGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action='delete-job']");
    if (!button) {
      return;
    }

    const jobId = Number.parseInt(button.dataset.id, 10);
    if (Number.isNaN(jobId)) {
      return;
    }

    if (!hasEmployerSession()) {
      setFormStatus(elements.employerAuthStatus, "Sign in first to manage listings.", "error");
      openAuthModal("employer");
      return;
    }

    const targetJob = getJobById(jobId);
    if (!targetJob) {
      return;
    }

    const shouldDelete = window.confirm(`Remove listing for ${targetJob.title}?`);
    if (!shouldDelete) {
      return;
    }

    try {
      if (state.apiOnline) {
        await requestJson(`/api/jobs/${jobId}`, {
          method: "DELETE",
          headers: {
            ...getEmployerAuthHeaders()
          }
        });
      } else {
        const ownedJob = state.jobs.find((job) => (
          job.id === jobId
          && normalizeEmployerEmail(job.employerEmail) === state.employerSession.employerEmail
          && String(job.employerKey || "") === state.employerSession.employerKey
        ));

        if (!ownedJob) {
          throw new Error("You are not allowed to remove this job listing.");
        }
      }

      state.jobs = state.jobs.filter((job) => job.id !== jobId);
      state.applications = state.applications.filter((application) => application.jobId !== jobId);
      renderJobCards();
      renderListings();
      renderApplications();
    } catch (error) {
      setFormStatus(elements.postJobStatus, error.message || "Could not remove listing.", "error");
    }
  });
}

function setupApplyForm() {
  if (!elements.applyForm) {
    return;
  }

  elements.applyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus(elements.applyStatus, "Submitting application...");

    const formData = new FormData(elements.applyForm);
    const payload = {
      jobId: Number.parseInt(String(formData.get("jobId") || ""), 10),
      applicantName: String(formData.get("applicantName") || "").trim(),
      applicantEmail: String(formData.get("applicantEmail") || "").trim(),
      applicantPhone: String(formData.get("applicantPhone") || "").trim(),
      coverLetter: String(formData.get("coverLetter") || "").trim()
    };
    const cvFile = formData.get("cvFile");
    const hasCv = cvFile instanceof File && cvFile.name;

    if (Number.isNaN(payload.jobId) || !payload.applicantName || !payload.applicantEmail || !hasCv) {
      setFormStatus(elements.applyStatus, "Name, email, and CV file are required.", "error");
      return;
    }

    if (!hasEmployeeSession()) {
      setFormStatus(elements.applyStatus, "Sign in as employee before submitting an application.", "error");
      openAuthModal("employee");
      return;
    }

    if (state.apiOnline && !hasEmployeeToken()) {
      setFormStatus(elements.applyStatus, "Employee session expired. Sign in again to apply.", "error");
      openAuthModal("employee");
      return;
    }

    try {
      let createdApplication;

      if (state.apiOnline) {
        const multipartPayload = new FormData();
        multipartPayload.append("jobId", String(payload.jobId));
        multipartPayload.append("applicantName", payload.applicantName);
        multipartPayload.append("applicantEmail", payload.applicantEmail);
        multipartPayload.append("applicantPhone", payload.applicantPhone);
        multipartPayload.append("coverLetter", payload.coverLetter);
        multipartPayload.append("cvFile", cvFile);

        const authHeaders = getEmployeeAuthHeaders();

        const response = await fetchWithTimeout(`${API_BASE}/api/applications`, {
          method: "POST",
          headers: {
            ...authHeaders
          },
          body: multipartPayload
        });

        const responsePayload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if ((response.status === 401 || response.status === 403) && hasEmployeeToken()) {
            clearEmployeeSession();
            setFormStatus(
              elements.employeeAuthStatus,
              responsePayload.message || "Employee session expired. Please sign in again.",
              "error"
            );
            openAuthModal("employee");
          }

          throw new Error(responsePayload.message || "Could not submit application.");
        }

        createdApplication = responsePayload.data;
      } else {
        createdApplication = {
          id: Date.now(),
          ...payload,
          cvOriginalName: cvFile.name,
          cvMimeType: cvFile.type || "",
          cvUrl: URL.createObjectURL(cvFile),
          createdAt: new Date().toISOString()
        };
      }

      state.applications = [createdApplication, ...state.applications];
      renderApplications();
      elements.applyForm.reset();
      elements.applyJobId.value = String(payload.jobId);
      setFormStatus(elements.applyStatus, "Application submitted successfully.", "success");

      if (state.apiOnline) {
        await refreshJobsAndApplications();
      }
    } catch (error) {
      setFormStatus(elements.applyStatus, error.message || "Could not submit application.", "error");
    }
  });
}

async function init() {
  loadEmployeeSession();
  loadEmployerSession();
  setupMenu();
  setupActiveNavigation();
  setupRevealAnimation();
  setupModalEvents();
  setAuthModalRole("employee");
  setupJobSearch();
  setupJobActions();
  setupEmployeeAuthForm();
  setupEmployeeLogoutAction();
  setupEmployerAuthForm();
  setupEmployerLogoutAction();
  setupPostJobForm();
  setupListingActions();
  setupApplicationActions();
  setupApplyForm();
  await hydrateData();

  if (hasEmployerSession()) {
    setFormStatus(elements.employerAuthStatus, "Employer session ready.", "success");
  } else {
    setFormStatus(elements.employerAuthStatus, "Sign in to load your listings and CV files.", "");
  }

  if (hasEmployeeSession()) {
    setFormStatus(elements.employeeAuthStatus, "Employee session ready.", "success");
  } else {
    setFormStatus(elements.employeeAuthStatus, "Sign in as employee to submit applications.", "");
  }
}

init();
