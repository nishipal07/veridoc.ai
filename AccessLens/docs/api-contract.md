# AccessLens API Contract

This document provides the exact JSON response shapes and HTTP statuses for every endpoint in the AccessLens REST API.

All API responses follow a consistent envelope:
```json
{
  "success": boolean,
  "data"?: any,
  "error"?: string
}
```

---

## 1. Health & Information
- **Route**: `GET /api/health`
- **Description**: Returns API health status, database connection state, and limitations notice.
- **Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "AccessLens API",
    "database": "connected",
    "disclaimer": "AccessLens provides automated accessibility checks using axe-core. This is not a legal or official WCAG certification."
  }
}
```

---

## 2. Run Synchronous Scan
- **Route**: `POST /api/scans`
- **Description**: Performs a Playwright + axe-core audit synchronously, saves the result to MongoDB, and returns the full scan document.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "url": "https://example.com"
}
```
- **Success (201 Created)**:
```json
{
  "success": true,
  "data": {
    "_id": "674052ec7120a59f518e3a01",
    "url": "https://example.com/",
    "score": 91,
    "summary": {
      "critical": 0,
      "serious": 0,
      "moderate": 3,
      "minor": 0,
      "total": 3
    },
    "issues": [
      {
        "ruleId": "color-contrast",
        "impact": "moderate",
        "description": "Ensures the contrast between foreground and background colors meets WCAG 2 AA",
        "help": "Elements must have sufficient color contrast",
        "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/color-contrast",
        "recommendation": "Increase contrast between foreground text and background to at least 4.5:1 for standard text (3:1 for large text >= 18pt or bold >= 14pt).",
        "nodes": [
          {
            "selector": "a.more-info",
            "html": "<a class=\"more-info\" href=\"https://www.iana.org/domains/example\">More information...</a>"
          }
        ]
      }
    ],
    "createdAt": "2026-11-22T06:15:00.000Z"
  }
}
```
- **Error (400 Bad Request - SSRF or Malformed URL)**:
```json
{
  "success": false,
  "error": "Access to localhost and loopback addresses is prohibited."
}
```
- **Error (504 Gateway Timeout - >30s navigation)**:
```json
{
  "success": false,
  "error": "Scan timed out: The target website took more than 30 seconds to load."
}
```

---

## 3. Get Scan History
- **Route**: `GET /api/scans`
- **Description**: Returns all audit records (newest first, summary projections).
- **Success (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "674052ec7120a59f518e3a01",
      "url": "https://example.com/",
      "score": 91,
      "summary": {
        "critical": 0,
        "serious": 0,
        "moderate": 3,
        "minor": 0,
        "total": 3
      },
      "createdAt": "2026-11-22T06:15:00.000Z"
    }
  ]
}
```

---

## 4. Get Scan Details by ID
- **Route**: `GET /api/scans/:id`
- **Description**: Returns the complete scan record with all detected issues, failing nodes, trimmed HTML snippets, and fix recommendations.
- **Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "674052ec7120a59f518e3a01",
    "url": "https://example.com/",
    "score": 91,
    "summary": {
      "critical": 0,
      "serious": 0,
      "moderate": 3,
      "minor": 0,
      "total": 3
    },
    "issues": [
      {
        "ruleId": "color-contrast",
        "impact": "moderate",
        "description": "Ensures the contrast between foreground and background colors meets WCAG 2 AA",
        "help": "Elements must have sufficient color contrast",
        "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/color-contrast",
        "recommendation": "Increase contrast between foreground text and background to at least 4.5:1 for standard text (3:1 for large text >= 18pt or bold >= 14pt).",
        "nodes": [
          {
            "selector": "a.more-info",
            "html": "<a class=\"more-info\" href=\"https://www.iana.org/domains/example\">More information...</a>"
          }
        ]
      }
    ],
    "createdAt": "2026-11-22T06:15:00.000Z"
  }
}
```
- **Error (404 Not Found)**:
```json
{
  "success": false,
  "error": "Scan not found"
}
```

---

## 5. Download PDF Audit Report
- **Route**: `GET /api/scans/:id/report`
- **Description**: Streams a generated PDF document with audit summary, score, disclaimer, and itemized issues.
- **Headers**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="AccessLens-Report-674052ec7120a59f518e3a01.pdf"`
- **Error (404 Not Found)**:
```json
{
  "success": false,
  "error": "Scan not found"
}
```

---

## 6. Delete Scan
- **Route**: `DELETE /api/scans/:id`
- **Description**: Removes a scan from MongoDB.
- **Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Scan deleted successfully",
    "id": "674052ec7120a59f518e3a01"
  }
}
```
- **Error (404 Not Found)**:
```json
{
  "success": false,
  "error": "Scan not found"
}
```

---

## 7. Compare Two Scans
- **Route**: `GET /api/scans/compare?a=:id&b=:id`
- **Description**: Compares two scans (`a` = before/baseline, `b` = after/target) matching issues by `ruleId + selector`.
- **Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "scanA": {
      "_id": "674052ec7120a59f518e3a01",
      "url": "https://example.com/",
      "score": 75,
      "createdAt": "2026-11-20T10:00:00.000Z"
    },
    "scanB": {
      "_id": "674052ec7120a59f518e3a02",
      "url": "https://example.com/",
      "score": 91,
      "createdAt": "2026-11-22T06:15:00.000Z"
    },
    "scoreDelta": 16,
    "fixed": [
      {
        "ruleId": "image-alt",
        "selector": "img.logo"
      }
    ],
    "new": [],
    "unchanged": [
      {
        "ruleId": "color-contrast",
        "selector": "a.more-info"
      }
    ]
  }
}
```
- **Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Both scan IDs 'a' and 'b' are required query parameters."
}
```
