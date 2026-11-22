# AccessLens 🔍

**AccessLens** is an automated website accessibility auditor built for high-speed, reliable hackathon demonstrations. It evaluates public web pages against WCAG 2 Level A & AA standards using Playwright and `@axe-core/playwright`, calculates an estimated accessibility score out of 100, presents actionable rule-based remediation with before/after code snippets, performs historical diff comparisons, and generates downloadable PDF audit reports.

---

## ⚡ Quick Start & Setup

### Prerequisites
- **Node.js** v18+ (tested on Node v20/v24)
- **npm** v9+
- Optional: MongoDB running locally (otherwise an automated in-memory MongoDB fallback engages transparently with zero setup)

---

### 1. Backend Setup & Run

```bash
cd AccessLens/backend

# Install dependencies and Playwright Chromium
npm install
npx playwright install chromium

# Copy environment template
cp .env.example .env

# Run development server (http://localhost:5000)
npm run dev

# Run comprehensive test suite (SSRF, Live Audits, Compare, PDF generation, Edge Cases)
npm test
```

> **Zero-Friction Hackathon Mode:** If no local MongoDB is detected on port 27017, the backend automatically starts an in-memory MongoDB instance via `mongodb-memory-server` so the application runs immediately without installing or configuring external services.

---

### 2. Frontend Setup & Run

```bash
cd AccessLens/frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run Vite development server (http://localhost:5173)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## ⚙️ Environment Variables

### Backend (`AccessLens/backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express REST API server |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/accesslens` | Primary MongoDB connection string |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/accesslens` | Secondary/legacy MongoDB connection string |

### Frontend (`AccessLens/frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL for backend API requests |

---

## 📑 Complete API Endpoints List

All responses return a consistent envelope: `{ "success": boolean, "data"?: any, "error"?: string }`.

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Healthcheck, database status, and limitations notice | `200` |
| `POST` | `/api/scans` | Performs synchronous Playwright + axe-core audit and saves to DB | `201`, `400`, `502`, `504` |
| `GET` | `/api/scans` | Returns scan history summaries (newest first, summary fields only) | `200`, `500` |
| `GET` | `/api/scans/:id` | Returns full scan details with trimmed HTML snippets and selectors | `200`, `400`, `404` |
| `GET` | `/api/scans/:id/report` | Streams downloadable PDF report with header `%PDF-` | `200`, `404` |
| `DELETE` | `/api/scans/:id` | Deletes scan record from database | `200`, `400`, `404` |
| `GET` | `/api/scans/compare?a=:id&b=:id` | Compares two scans: score delta, `fixed`, `new`, and `stillPresent` | `200`, `400`, `404` |

---

## 🛡️ Security, SSRF & Edge-Case Protection

1. **SSRF Guard**:
   - Strictly restricts protocols to `http:` and `https:`.
   - Resolves hostnames via `dns.promises.lookup` and checks all IP records.
   - Blocks loopback (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), cloud metadata endpoints (`169.254.169.254`), and carrier-grade NAT (`100.64.0.0/10`).
   - Aborts redirected requests attempting to reach private addresses.
2. **Navigation Timeout**:
   - Hard 30-second navigation timeout limit (`504 Gateway Timeout` returned with user-friendly error).
3. **Unreachable Domains**:
   - Non-existent domains or network connection failures return friendly `400` or `502 Bad Gateway` error messages.
4. **Large Page Safeguard**:
   - Snippets are strictly capped to $\le 300$ characters. Full page HTML is never stored.
   - For very large pages with hundreds of violations, stored failing DOM nodes are capped at 50 per rule to prevent MongoDB document size limits ($16\text{MB}$) or client freeze.
5. **Guaranteed Resource Cleanup**:
   - Playwright Chromium instances and browser contexts are guaranteed to terminate inside a `finally` block on success, timeout, or error.

---

## 📊 Scoring Metric

- **Formula**:
  $$\text{score} = \max(0, 100 - (10 \times \text{critical} + 6 \times \text{serious} + 3 \times \text{moderate} + 1 \times \text{minor}))$$
- **Label**: **"Estimated accessibility score"**.
- **Counting Rule**: Each violated axe-core rule is counted once per affected node group toward the penalty to prevent repetitive items (e.g., 30 icons missing alt text) from skewing the overall health of the site to zero. All individual failing elements are preserved in the detailed report.

---

## 💡 Rule-Based Remediation Engine

Provides structured, actionable remediation (`explanation`, `incorrectCode`, `correctedCode`) for key accessibility rules:
- `image-alt`
- `label`
- `color-contrast`
- `button-name`
- `link-name`
- `duplicate-id`
- `heading-order`
- `html-has-lang`
- `document-title`
- *Generic fallback* deriving guidance from axe help text and WCAG guidelines for any other rule.

---

## ⚠️ Known Limitations & Legal Disclaimer

- **Automated Testing Coverage**: AccessLens performs automated accessibility checks using the industry-standard axe-core engine. Automated testing can only detect approximately **30% to 50%** of all accessibility barriers defined by the Web Content Accessibility Guidelines (WCAG).
- **Not a Legal Certification**: This audit is an automated evaluation tool and does **not** constitute an official, certified, or legally binding WCAG 2.0 / 2.1 Level AA compliance audit.
- **Manual Testing Required**: Critical accessibility criteria (e.g., screen reader pronunciation and navigation flow, logical tab order, complex ARIA widget interaction, audio/video captions, cognitive readability) require human manual testing and evaluation with assistive technologies.
