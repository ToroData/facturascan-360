---
id: analytics-agent
title: 10. Analytics Agent (MCP)
---

# Analytics Agent – Business Context Generator (MCP)

## Overview

The **AnalyticsAgent** computes high-level business insights from the structured invoice data present in the `InvoiceContext`. Its output is a compact, semantically rich `AnalyticsContext`, which enables business intelligence, KPI aggregation, and conversational queries.

This agent enables the transformation of invoice metadata into time-series metrics, supplier statistics, and cost categorization patterns. It is optimized for fast retrieval and downstream use by the `/chat/query` interface.

---

## 1. Input: `InvoiceContext`

The agent receives as input a valid `InvoiceContext` (see [`04-mcp-schemas.md`](../protocols/04-mcp-schemas.md)). The minimum required fields are:

- `supplier_name`, `supplier_tax_id`
- `subtotal`, `vat`, `total`, `currency`
- `issue_date`, `due_date`
- Optional: `line_items`, `category`, `cost_center`

---

## 2. Output: `AnalyticsContext`

This context encodes derived metrics for the invoice and optionally aggregates historical values for trend analysis.

### JSON Schema (v1.0)

```json
{
  "invoice_id": "UUID",
  "agent": "AnalyticsAgent_v1.0",
  "processed_at": "timestamp",
  "insights": {
    "supplier_category": "string",
    "total_in_year": "number",
    "monthly_spend_avg": "number",
    "anomaly_flag": "boolean",
    "price_variation": {
      "compared_to_last_invoice": "string",
      "12_month_trend": "increasing" | "decreasing" | "stable"
    },
    "cost_center": "string"
  },
  "version": "1.0"
}
```

---

## 3. Metrics Computed

| Metric                     | Field               | Source / Calculation                                              |
| -------------------------- | ------------------- | ----------------------------------------------------------------- |
| Supplier category          | `supplier_category` | Determined via name mapping or keyword extraction                 |
| Year-to-date spend         | `total_in_year`     | Sum of total invoices with same supplier in current calendar year |
| Monthly average            | `monthly_spend_avg` | Rolling 6-month average by supplier                               |
| Price variation            | `price_variation`   | Compared to last invoice by same supplier                         |
| Trend detection            | `12_month_trend`    | Slope estimation (regression or monotonic delta)                  |
| Anomaly flag               | `anomaly_flag`      | Based on z-score or MAD deviation threshold                       |
| Cost center classification | `cost_center`       | Derived from keywords or past tagging                             |

---

## 4. Logic Flow

```plaintext
InvoiceContext
   ↓
Data Normalization
   ↓
Supplier Matching + Historical Lookup
   ↓
Trend and Deviation Calculation
   ↓
Context Assembly → AnalyticsContext
```

* Supplier is matched across historical invoices
* Historical totals and average are computed from DB or preloaded cache
* Price deviation is computed vs. previous invoice
* Trend is inferred from monthly totals using statistical regression

---

## 5. Example Output

```json
{
  "invoice_id": "9cfe-0021-b1d3",
  "agent": "AnalyticsAgent_v1.0",
  "processed_at": "2025-05-09T12:33:22Z",
  "insights": {
    "supplier_category": "software services",
    "total_in_year": 18425.30,
    "monthly_spend_avg": 1535.44,
    "anomaly_flag": false,
    "price_variation": {
      "compared_to_last_invoice": "+8.3%",
      "12_month_trend": "increasing"
    },
    "cost_center": "IT & Cloud Infrastructure"
  },
  "version": "1.0"
}
```

---

## 6. Aggregation & Caching

For performance, the agent can use pre-aggregated materialized views or cache tables:

* Monthly spend by supplier
* Historical invoice amounts
* Supplier → category mappings
* Last invoice per supplier

These are updated on each new invoice using lightweight triggers or scheduled jobs.

---

## 7. Deployment and Execution

| Mode               | Technology         | Notes                                   |
| ------------------ | ------------------ | --------------------------------------- |
| Synchronous Lambda | Python (Stateless) | Triggered after validation              |
| ECS Microservice   | Docker + Flask     | For bulk analytics or manual retraining |
| Scheduled Job      | Step Function      | For recomputing full supplier analytics |

---

## 8. Use by Other Modules

| Module               | Field(s) Used                            | Purpose                                |
| -------------------- | ---------------------------------------- | -------------------------------------- |
| Conversational Agent | All fields                               | Natural language reports               |
| Dashboard Generator  | `monthly_spend_avg`, `trend`, `category` | Charting and supplier ranking          |
| Alert Agent (future) | `anomaly_flag`, `price_variation`        | Fiscal supervision or budget deviation |

---

## 9. Versioning and Retraining

* AnalyticsAgent is versioned independently (`AnalyticsAgent_v1.x`)
* Each generated context embeds the agent version used
* Retraining or logic updates follow CI/CD via Git + Docker image

---

## 10. Summary

The `AnalyticsAgent` transforms low-level invoice data into actionable business knowledge. By encapsulating derived fields in the MCP `AnalyticsContext`, it enables AI agents and dashboards to answer high-level strategic questions with precision and traceability.

Next: see [`11-agent-architecture.md`](./11-agent-architecture.md) for a global overview of how agents are orchestrated under MCP.
