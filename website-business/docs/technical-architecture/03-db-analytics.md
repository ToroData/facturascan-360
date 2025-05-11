---
id: db-analytics
title: 3. Relational Database Design
---

# Relational Database Design – FacturaScan 360

## Overview

This document defines the relational data model for *FacturaScan 360*, including entity structure, multi-tenant strategies, indexing policies, analytical views, and compatibility with Business Intelligence (BI) tools. The goal is to enable secure, performant, and scalable storage of invoice-related data, user access control, and validation outcomes.

---

## 1. Core Tables

### 1.1. `organizations`
Represents each tenant (client company).

| Column        | Type       | Description                            |
|---------------|------------|----------------------------------------|
| `id`          | UUID (PK)  | Unique organization identifier         |
| `name`        | TEXT       | Organization legal name                |
| `created_at`  | TIMESTAMP  | Registration date                      |
| `is_active`   | BOOLEAN    | Activation status                      |

---

### 1.2. `users`
Represents system users, linked to organizations.

| Column         | Type        | Description                              |
|----------------|-------------|------------------------------------------|
| `id`           | UUID (PK)   | Unique user identifier                   |
| `email`        | TEXT        | User email address                       |
| `role`         | TEXT        | Enum: 'admin', 'editor', 'reviewer', 'viewer' |
| `tenant_id`    | UUID (FK)   | Foreign key to `organizations.id`        |
| `created_at`   | TIMESTAMP   | Account creation date                    |
| `is_active`    | BOOLEAN     | Active flag (managed via Cognito)        |

---

### 1.3. `invoices`
Stores uploaded invoice metadata and status.

| Column             | Type        | Description                            |
|--------------------|-------------|----------------------------------------|
| `id`               | UUID (PK)   | Unique invoice identifier              |
| `tenant_id`        | UUID (FK)   | Owner organization                     |
| `uploaded_by`      | UUID (FK)   | User who uploaded                      |
| `supplier_name`    | TEXT        | Detected supplier                      |
| `invoice_number`   | TEXT        | Supplier-provided number               |
| `issue_date`       | DATE        | Invoice issue date                     |
| `due_date`         | DATE        | Invoice due date                       |
| `subtotal`         | NUMERIC     | Amount before VAT                      |
| `vat`              | NUMERIC     | Value-added tax                        |
| `total`            | NUMERIC     | Total amount                           |
| `status`           | TEXT        | Enum: 'pending', 'validated', 'error'  |
| `created_at`       | TIMESTAMP   | Upload timestamp                       |
| `file_url`         | TEXT        | S3 URL for the PDF                     |

**Indexes**:  
- Composite: `(tenant_id, issue_date)`  
- Single: `invoice_number`, `supplier_name`, `created_at`

---

### 1.4. `validations`
Stores validation results per invoice.

| Column          | Type        | Description                          |
|-----------------|-------------|--------------------------------------|
| `id`            | UUID (PK)   | Validation record                    |
| `invoice_id`    | UUID (FK)   | Link to invoice                      |
| `rule_code`     | TEXT        | Validation rule ID (e.g., 'V-01')     |
| `message`       | TEXT        | Description of violation             |
| `severity`      | TEXT        | Enum: 'info', 'warning', 'error'     |
| `created_at`    | TIMESTAMP   | Validation timestamp                 |

**Index**: `invoice_id`

---

### 1.5. `alerts`
Triggered notifications (email, Slack) based on validation.

| Column         | Type        | Description                           |
|----------------|-------------|---------------------------------------|
| `id`           | UUID (PK)   | Alert ID                              |
| `invoice_id`   | UUID (FK)   | Affected invoice                      |
| `type`         | TEXT        | Enum: 'email', 'slack', 'teams'       |
| `status`       | TEXT        | Enum: 'sent', 'failed', 'pending'     |
| `recipient`    | TEXT        | Email or webhook URL                  |
| `triggered_at` | TIMESTAMP   | Time of dispatch                      |

---

### 1.6. `logs`
Tracks user actions and system-level events.

| Column         | Type        | Description                            |
|----------------|-------------|----------------------------------------|
| `id`           | UUID (PK)   | Log entry                              |
| `user_id`      | UUID (FK)   | User responsible                       |
| `tenant_id`    | UUID (FK)   | Associated organization                |
| `action_type`  | TEXT        | Enum: 'upload', 'validate', 'alert'    |
| `description`  | TEXT        | Free-text description                  |
| `timestamp`    | TIMESTAMP   | Time of event                          |

---

## 2. Multi-Tenant Design

FacturaScan 360 supports **logical separation of tenant data** using:

- **Shared schema** with `tenant_id` in all tables.
- **Row-Level Security (RLS)** in PostgreSQL, activated with:
  ```sql
  CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

Upon each request, the backend sets:

```sql
SET app.current_tenant = 'org_12ab3c';
```

**Advantages**:

* Simplifies schema management.
* Enables PostgreSQL-native tenant isolation.
* Compatible with BI tools.

---

## 3. Analytical Views

Designed to support dashboards and external BI queries.

### 3.1. `view_invoice_totals_monthly`

Aggregates invoice totals by tenant and month.

```sql
CREATE VIEW view_invoice_totals_monthly AS
SELECT
  tenant_id,
  date_trunc('month', issue_date) AS month,
  COUNT(*) AS invoice_count,
  SUM(subtotal) AS total_subtotal,
  SUM(vat) AS total_vat,
  SUM(total) AS total_amount
FROM invoices
GROUP BY tenant_id, month;
```

---

### 3.2. `view_validation_summary`

Summarizes validations by rule and severity.

```sql
CREATE VIEW view_validation_summary AS
SELECT
  v.tenant_id,
  v.rule_code,
  v.severity,
  COUNT(*) AS occurrences
FROM validations v
JOIN invoices i ON v.invoice_id = i.id
GROUP BY v.tenant_id, v.rule_code, v.severity;
```

---

### 3.3. `view_duplicate_invoices`

Detects potential duplicates based on supplier and number.

```sql
CREATE VIEW view_duplicate_invoices AS
SELECT
  tenant_id,
  supplier_name,
  invoice_number,
  COUNT(*) AS occurrences
FROM invoices
GROUP BY tenant_id, supplier_name, invoice_number
HAVING COUNT(*) &gt; 1;
```

---

## 4. Derived Columns and Metrics

To support advanced reporting and future anomaly detection:

| Column                | Table    | Formula / Source                          |
| --------------------- | -------- | ----------------------------------------- |
| `vat_ratio`           | invoices | `vat / subtotal`                          |
| `is_total_consistent` | invoices | `ABS(total - (subtotal + vat)) &lt; 0.01` |
| `error_count`         | invoices | COUNT from `validations`                  |
| `has_critical_alert`  | invoices | EXISTS critical validation OR alert       |

These columns can be precomputed or exposed as **materialized views**.

---

## 5. BI Tool Compatibility

The schema is designed to be compatible with tools such as:

| Tool     | Integration Method           | Notes                               |
| -------- | ---------------------------- | ----------------------------------- |
| Metabase | PostgreSQL direct connection | Read-only user role                 |
| Superset | SQLAlchemy or direct PGSQL   | Supports dashboards and alerts      |
| Tableau  | PostgreSQL connector         | Can use views and materialized data |

Additional features to support BI access:

* Indexing on time-based and grouping columns.
* Materialized views for expensive aggregations.
* Read-only DB role for dashboard queries.

---

## 6. Maintenance and Performance Notes

* Use **partitioning by tenant** if scaling to large volumes.
* Schedule **VACUUM ANALYZE** periodically.
* Enable **query logging** for BI traffic to monitor cost.
* Prepare **archive tables** for invoices > 12 months old.

---
