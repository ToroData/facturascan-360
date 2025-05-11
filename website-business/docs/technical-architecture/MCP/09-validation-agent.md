---
id: validation-agent
title: 9. Validation Agent (MCP)
---

# Validation Agent – Semantic Rule Engine (MCP)

## Overview

The **ValidationAgent** in *FacturaScan 360* is responsible for applying a predefined set of semantic, fiscal, and temporal validation rules to structured invoice data provided in the `InvoiceContext`. It outputs a standardized `ValidationContext` compliant with the Model Context Protocol (MCP).

The agent ensures the invoice complies with legal, accounting, and operational constraints defined per jurisdiction or industry norm.

---

## 1. Input Schema

The agent receives a single `InvoiceContext` object (as defined in [`06-mcp-schemas.md`](./06-mcp-schemas.md)).

### Minimal Required Fields

- `invoice_number`, `issue_date`, `due_date`
- `subtotal`, `vat`, `total`
- `supplier_name`, `supplier_tax_id`
- Optional: `line_items`, `currency`, `payment_method`

---

## 2. Output Schema – `ValidationContext`

```json
{
  "invoice_id": "UUID",
  "agent": "ValidationAgent_v1.0",
  "validation_date": "timestamp",
  "rule_results": [
    {
      "rule_id": "V-01",
      "description": "VAT must be between 0 and 21%",
      "passed": false,
      "severity": "critical",
      "value_observed": 0.25,
      "suggestion": "Check supplier tax status or invoice type",
      "references": ["invoice_context.vat"]
    }
  ],
  "overall_status": "invalid",
  "notes": "Detected VAT anomaly",
  "version": "1.0"
}
```

---

## 3. Rule Engine Design

### 3.1. Rule Representation

Each rule is represented by a JSON-like definition:

```json
{
  "rule_id": "V-03",
  "description": "Subtotal + VAT must equal total",
  "severity": "critical",
  "field_refs": ["subtotal", "vat", "total"],
  "condition": "(subtotal + vat) ≈ total",
  "tolerance": 0.01
}
```

### 3.2. Rule Categories

| Category        | Description                      |
| --------------- | -------------------------------- |
| Fiscal          | Tax logic, subtotal consistency  |
| Temporal        | Date logic (e.g., due >= issue)  |
| Structural      | Required fields and uniqueness   |
| Duplicate logic | Match against invoice history    |
| Supplier checks | Field format, tax ID consistency |

---

## 4. Core Ruleset (v1.0)

| Rule ID | Description                                         | Type       | Severity |
| ------- | --------------------------------------------------- | ---------- | -------- |
| V-01    | VAT must be ≥ 0 and ≤ 21%                           | Fiscal     | Critical |
| V-02    | Issue date must precede due date                    | Temporal   | Major    |
| V-03    | Subtotal + VAT ≈ Total (within €0.01)               | Fiscal     | Critical |
| V-04    | Supplier name must be present                       | Structural | Critical |
| V-05    | Invoice number must be unique for the same supplier | Duplicate  | Critical |
| V-06    | Invoice currency must be declared                   | Structural | Minor    |
| V-07    | Payment method should be present (if required)      | Structural | Info     |
| V-08    | Missing tax ID triggers warning                     | Structural | Warning  |

---

## 5. Execution Pipeline

```plaintext
InvoiceContext
   ↓
Rule Loader (YAML or DB)
   ↓
ValidationEngine (loop over rules)
   ↓
Evaluation Engine
   ↓
Output → ValidationContext
```

Each rule is evaluated dynamically using field references and mathematical expressions. Failed rules are logged with:

* Observed values
* Severity
* Suggested action (if applicable)

---

## 6. Agent Deployment

| Mode         | Technology             | Deployment                      |
| ------------ | ---------------------- | ------------------------------- |
| Cloud Lambda | Python + FastAPI       | Event-driven via Step Functions |
| ECS service  | Docker container       | For batch or parallel inference |
| CI Testing   | `pytest` with fixtures | Validates rules and outputs     |

---

## 7. Example – Rule Violation

### Input

```json
"vat": 250.00,
"subtotal": 500.00,
"total": 710.00
```

### Output

```json
{
  "rule_id": "V-03",
  "description": "Subtotal + VAT must equal total",
  "passed": false,
  "value_observed": 750.00 vs 710.00,
  "severity": "critical",
  "suggestion": "Check for miscalculation or discount not applied"
}
```

---

## 8. Rule Versioning and Lifecycle

* Rules are versioned (e.g., `validation_rules_v1.0.yaml`)
* The `ValidationAgent` references the exact rule version used
* If the rule definition changes, agent version must be incremented
* Old validations remain reproducible and immutable

---

## 9. Integration with Other Modules

* **Trigger**: After `InvoiceContext` creation
* **Storage**: `validation_context` field in DB (`invoices` table)
* **Alert System**: Parses output for severity `critical | major`
* **Chat Agent**: Uses rules to explain anomalies

---

## 10. Summary

The `ValidationAgent` ensures invoice data quality and correctness by applying deterministic, explainable rules to structured invoice content. It serves as the first MCP-compliant AI agent in the invoice processing pipeline, enabling downstream logic (alerts, analytics, dialogue) to operate on trustworthy data.

Next: see [`10-analytics-agent.md`](./10-analytics-agent.md) for the construction of the `AnalyticsContext` used in business reporting.