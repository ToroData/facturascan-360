---
id: mvp-design
title: 2. MVP Design
---

# MVP Technical and Functional Design – FacturaScan 360

## Overview

This document defines the scope, components, technologies, limitations, and success criteria of the Minimum Viable Product (MVP) for *FacturaScan 360*. The MVP is designed to be implemented and maintained by a single developer, with a clear focus on functionality, simplicity, and extensibility. It aims to offer immediate value to freelancers, SMEs, and accounting firms, while serving as a foundation for scalable future development.

---

## 1. Essential Functionalities

The following core functionalities are included in the MVP:

### 1.1. PDF OCR with AWS Textract
- Users upload one or multiple PDF invoices via a web interface or mobile-friendly browser.
- AWS Textract performs optical character recognition to extract invoice fields.
- Output is returned in JSON format and forwarded to the parser module.

### 1.2. Semantic Parser and Validation Engine
- The extracted fields are parsed and validated using rule-based logic.
- Validation rules include:
  - VAT must be non-negative and not exceed a defined threshold (e.g., 21%).
  - Due date must not precede the invoice issue date.
  - Duplicate detection via supplier + invoice number.
  - Total must match the sum of subtotal + VAT (within tolerance).
- Validation results are stored and used for alert triggering and display logic.

### 1.3. Relational Data Storage (SQL)
- All extracted and validated data is stored in a structured relational database.
- Tables include: `invoices`, `suppliers`, `validation_errors`, `uploads`.
- Two storage modes:
  - **Local prototype**: SQLite (zero-configuration)
  - **Cloud deployment**: PostgreSQL (on AWS RDS or self-hosted on EC2)

### 1.4. Basic Dashboard and Visual Feedback
- A web dashboard shows:
  - Recent uploads and status (valid, warning, error).
  - Validation error breakdown.
  - Summary by supplier, amount, VAT, and dates.
- Technologies:
  - Option 1: **Streamlit** (fastest for solo developer, less customizable)
  - Option 2: **Flask + Jinja2 + Tailwind CSS** (preferred for extensibility)
- No login system or multiuser logic in MVP.

### 1.5. Email-Based Alerting System
- When validation rules are violated:
  - An alert email is sent via AWS SES or SMTP provider.
  - Message includes summary of error(s), document name, and suggested action.
- Alerts are triggered synchronously during the validation step.

---

## 2. Recommended Technologies and Tools

| Component      | Technology                          | Rationale                                          |
|----------------|--------------------------------------|----------------------------------------------------|
| **Backend**    | Python 3.9+ with **FastAPI** or **Flask** | FastAPI for OpenAPI auto-docs; Flask for simplicity |
| **Frontend**   | HTML + Tailwind CSS + Jinja2         | Lightweight, maintainable, no SPA complexity       |
| **OCR**        | AWS Textract                         | Reliable OCR with invoice-mode support             |
| **Database**   | SQLite (local), PostgreSQL (cloud)   | Progressive upgrade path with minimal refactoring  |
| **Alerting**   | AWS SES or SMTP via `smtplib`        | Simple email delivery with custom templates        |
| **Hosting**    | EC2 t2.micro or t3a.micro (local test or low-traffic SaaS) | Balance between cost and control |

---

## 3. MVP Exclusions

The following features are explicitly excluded from the MVP to reduce scope and ensure feasibility:

| Excluded Feature               | Reason                                                                 |
|--------------------------------|------------------------------------------------------------------------|
| Billing integration (Stripe)  | Not needed until subscription-based deployment                        |
| Multiuser support with roles  | Avoids complexity in authentication and permissions logic             |
| Digital signature module       | Legally relevant, but not required for pilot value                    |
| Natural language insights / MCP | Reserved for advanced roadmap once sufficient data is collected       |
| ERP integrations               | Deferred to commercial version once market fit is validated           |
| Multi-language support         | Interface remains in English or Spanish only in MVP                   |

---

## 4. MVP Success Criteria

The MVP will be considered successful if it meets the following usage, onboarding, and outcome goals:

| Criterion                                             | Target                                       |
|------------------------------------------------------|----------------------------------------------|
| Installation or deployment time                      | ≤ 48 hours by a non-expert user              |
| Upload of batch of PDFs                              | Supported via drag-and-drop or file browser  |
| Alerting system                                      | Sends email notifications for all major errors |
| Dashboard usage                                      | User can navigate and understand validation results without training |
| Demonstration value                                  | Can be used in pilot demos with minimal setup |

---

## 5. Modular Design for Extensibility

Each functional unit is structured as a standalone module with minimal coupling to facilitate scaling and future reusability:

| Module                | Description                                          | Decoupling strategy                                |
|-----------------------|------------------------------------------------------|----------------------------------------------------|
| **OCR Handler**       | Wraps Textract API calls                            | Separate Python module (`ocr_handler.py`)          |
| **Parser/Validator**  | Applies validation rules to structured OCR output   | Isolated logic with pluggable rules (`rules.py`)   |
| **Data Model**        | Encapsulates DB schema and ORM logic                | SQLAlchemy-based or raw SQL in a separate layer    |
| **Alert Engine**      | Sends emails based on validation output             | Triggered by validator, but implemented independently |
| **Dashboard Renderer**| Displays records and summaries                      | Flask blueprint or Streamlit page                  |

This structure enables incremental replacement (e.g., switching OCR engine or adding user login) without redesign.

---

## 6. Deployment Model

FacturaScan 360 is offered strictly as a managed SaaS product. There is no local installation option. The platform includes:

### Web Platform (Backoffice + Dashboard)
- Hosted backend and UI available via a web portal.
- Built using Python (FastAPI or Flask), HTML and Tailwind CSS.
- Deployed on AWS EC2 with HTTPS access and persistent sessions.
- Clients access the system via personalized login (single-tenant initially, multi-tenant in roadmap).

### Mobile Application (Data Ingress)
- Native app developed in Flutter.
- Enables users to:
  - Scan or upload invoice images and PDFs.
  - Tag and classify documents at the source.
  - Transmit documents securely to the backend.

### Backend Infrastructure
- AWS-hosted backend accessible via API for the web UI and mobile app.
- Invoice PDFs stored in Amazon S3.
- Text extraction via AWS Textract (synchronous or batch).
- Structured data stored in PostgreSQL (via RDS).
- Email alerts dispatched using Amazon SES.


