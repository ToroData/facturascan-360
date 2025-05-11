---
id: db-analytics
title: 3. Hybrid Relational + Semantic Database Design
---

# Hybrid Relational + Semantic Database Design – FacturaScan 360

## Overview

FacturaScan 360 integrates AWS Textract, semantic validation, and conversational analytics through a modular AI agent system governed by the Model Context Protocol (MCP). This architecture requires a database that supports:

- Structured and semi-structured data simultaneously.
- Persistent traceability of OCR results and validations.
- Storage and retrieval of semantic contexts exchanged via MCP agents.
- Analytical querying for dashboards and AI reporting agents.

This document defines a relational-hybrid data model optimized for multi-tenant SaaS, semantic processing, and BI tool integration.

---

## 1. Core Table: `invoices`

The `invoices` table captures the full lifecycle of a scanned invoice, from raw OCR to contextual MCP representations.

| Column               | Type          | Description                                                      |
|----------------------|---------------|------------------------------------------------------------------|
| `id`                 | UUID (PK)     | Unique invoice identifier                                        |
| `tenant_id`          | UUID (FK)     | Foreign key to `organizations.id`                                |
| `uploaded_by`        | UUID (FK)     | User who submitted the document                                 |
| `file_url`           | TEXT          | Location of the original PDF in S3                               |
| `textract_raw`       | JSONB         | Raw AWS Textract output                                          |
| `invoice_context`    | JSONB         | Parsed semantic representation (MCP schema)                      |
| `validation_context` | JSONB         | Validation outcomes (MCP schema)                                 |
| `analytics_context`  | JSONB         | Derived metrics and business features (MCP schema)               |
| `status`             | TEXT          | Enum: 'pending', 'validated', 'error', 'analyzed'                |
| `created_at`         | TIMESTAMP     | Upload timestamp                                                 |

**Indexes**:
- `(tenant_id, created_at)`
- `GIN(textract_raw)` and `GIN(invoice_context)` for JSONB search (optional)

---

## 2. Supporting Tables

### 2.1. `organizations`

| Column       | Type        | Description                         |
|--------------|-------------|-------------------------------------|
| `id`         | UUID (PK)   | Organization identifier             |
| `name`       | TEXT        | Legal or business name              |
| `created_at` | TIMESTAMP   | Account creation date               |

---

### 2.2. `users`

| Column       | Type        | Description                         |
|--------------|-------------|-------------------------------------|
| `id`         | UUID (PK)   | User ID                             |
| `email`      | TEXT        | Email (Cognito-based auth)          |
| `role`       | TEXT        | Enum: 'admin', 'editor', etc.       |
| `tenant_id`  | UUID (FK)   | Link to `organizations.id`          |
| `is_active`  | BOOLEAN     | Activation state                    |

---

### 2.3. `alerts`

| Column       | Type        | Description                         |
|--------------|-------------|-------------------------------------|
| `id`         | UUID (PK)   | Alert ID                            |
| `invoice_id` | UUID (FK)   | Affected invoice                    |
| `type`       | TEXT        | 'email', 'slack', 'teams'           |
| `status`     | TEXT        | 'sent', 'pending', 'failed'         |
| `triggered_at`| TIMESTAMP  | Time of alert dispatch              |

---

### 2.4. `logs`

Used for user actions and system auditing.

| Column        | Type        | Description                        |
|---------------|-------------|------------------------------------|
| `id`          | UUID (PK)   | Log ID                             |
| `user_id`     | UUID (FK)   | Associated user                    |
| `action_type` | TEXT        | 'upload', 'validate', 'alert'      |
| `description` | TEXT        | Free-text message                  |
| `timestamp`   | TIMESTAMP   | Action time                        |

---

## 3. Multi-Tenant Strategy

All tables share a **unified schema** with `tenant_id` as foreign key and enforcement via **PostgreSQL Row-Level Security (RLS)**.

### Policy Example

```sql
CREATE POLICY tenant_isolation ON invoices
USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 4. Analytical Views (SQL-Based)

### 4.1. Monthly Totals per Tenant

```sql
CREATE VIEW view_invoice_totals_monthly AS
SELECT
  tenant_id,
  date_trunc('month', created_at) AS month,
  COUNT(*) AS invoice_count,
  SUM((invoice_context->>'subtotal')::numeric) AS subtotal,
  SUM((invoice_context->>'vat')::numeric) AS vat,
  SUM((invoice_context->>'total')::numeric) AS total
FROM invoices
GROUP BY tenant_id, month;
```

---

### 4.2. Error Rate per Rule

```sql
CREATE VIEW view_validation_error_rate AS
SELECT
  tenant_id,
  validation_context->>'rule_id' AS rule_id,
  COUNT(*) AS occurrences
FROM invoices
WHERE status = 'error'
GROUP BY tenant_id, rule_id;
```

---

### 4.3. Duplicate Invoices Detected

```sql
CREATE VIEW view_possible_duplicates AS
SELECT
  tenant_id,
  invoice_context->>'supplier_name' AS supplier,
  invoice_context->>'invoice_number' AS invoice_number,
  COUNT(*) AS count
FROM invoices
GROUP BY tenant_id, supplier, invoice_number
HAVING COUNT(*) &gt; 1;
```

---

## 5. JSONB Column Semantics (MCP Contexts)

Each context field (`invoice_context`, `validation_context`, `analytics_context`) adheres to a well-defined **MCP schema**. These contexts are:

* **Machine-readable**
* **AI-agent-exchangeable**
* **Traceable** for audit and reprocessing

These will be detailed separately in the *MCP schema documentation*.

---

## 6. BI Compatibility and External Access

The data model supports direct integration with BI tools:

| Tool     | Access method             | Notes                                 |
| -------- | ------------------------- | ------------------------------------- |
| Metabase | PostgreSQL read-only user | Can explore both views and JSONB data |
| Superset | SQLAlchemy connector      | Used for advanced dashboards          |
| Tableau  | PostgreSQL driver         | Compatible with structured columns    |

---

## 7. Summary

The hybrid schema enables:

* Long-term persistence of raw and semantic invoice data.
* Modular integration of AI agents via MCP.
* Structured access to key metrics for validation and analytics.
* Extensibility for new agent types (e.g., risk scoring, audit compliance).

Next: see [`04-mcp-schemas.md`](./06-mcp-schemas.md) for definitions of `InvoiceContext`, `ValidationContext`, and `AnalyticsContext`.
