---
id: chat-query-api
title: 8. Conversational Query API Specification
---

# Conversational Query API – Specification

## Overview

This API enables conversational access to invoice-related analytics in *FacturaScan 360*. It connects user intent (expressed in natural language) with structured invoice data derived from `AnalyticsContext`, `InvoiceContext`, and optionally `ValidationContext`.

The endpoint is designed to be stateless, scalable, and compatible with chat UIs or external integrations (e.g., Slack bots, web widgets).

---

## 1. Endpoint Summary

| Method | URL              | Description                                  |
|--------|------------------|----------------------------------------------|
| POST   | `/chat/query`    | Processes a business question via MCP agent  |

### Authorization
- JWT Bearer token via AWS Cognito (required)
- Token must carry `tenant_id` and `role`

---

## 2. Request Body (JSON)

### Schema

```json
{
  "question": "string",
  "tenant_id": "UUID",
  "language": "en" | "es",
  "filters": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "supplier": "optional string",
    "category": "optional string"
  }
}
```

### Example

```json
{
  "question": "Which supplier increased their prices the most?",
  "tenant_id": "a3f1-8237-8ee3",
  "language": "en",
  "filters": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }
}
```

---

## 3. Response Body (JSON)

### Schema

```json
{
  "answer": "string",
  "query_type": "ranking" | "aggregation" | "anomaly" | "filter",
  "sql": "string",
  "entities": {
    "supplier": "optional string",
    "category": "optional string",
    "metric": "optional string"
  },
  "records": [ { "key": "value", ... } ],
  "confidence": 0.0 – 1.0
}
```

### Example

```json
{
  "answer": "Supplier ACME Cloud Hosting shows the highest price increase over the past 12 months, with an average variation of +18.7%.",
  "query_type": "ranking",
  "sql": "SELECT ...",
  "entities": {
    "supplier": null,
    "metric": "price_variation"
  },
  "records": [
    { "supplier": "ACME Cloud Hosting", "variation": "+18.7%" }
  ],
  "confidence": 0.92
}
```

---

## 4. Processing Pipeline

```plaintext
User Input → NLP Engine → MCP Resolver → SQL Builder → Result Formatter → Response
```

* NLP model classifies intent and extracts entities
* Resolver matches `AnalyticsContext` fields
* SQL is constructed dynamically and run over PostgreSQL
* Records are aggregated and formatted
* Answer is generated using NLG (basic template or LLM fine-tuned)

---

## 5. Error Responses

| Code | Condition                               | Message                               |
| ---- | --------------------------------------- | ------------------------------------- |
| 400  | Missing or invalid input                | "Invalid question format"             |
| 401  | Missing or expired token                | "Unauthorized"                        |
| 403  | Token lacks required tenant permissions | "Forbidden for tenant"                |
| 422  | No analytics context found              | "No data available for this tenant"   |
| 500  | Internal model failure or DB error      | "Internal error. Please retry later." |

---

## 6. Rate Limiting & Logging

* Rate: 60 queries/min per tenant (configurable)
* Logging: persisted to `chat_logs` table:

```sql
CREATE TABLE chat_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    question TEXT,
    answer TEXT,
    query_type TEXT,
    sql TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

---

## 7. Extension Notes

| Future Feature             | Description                                     |
| -------------------------- | ----------------------------------------------- |
| Contextual follow-up       | Enable threaded conversation state              |
| Voice-to-text integration  | Use Whisper/OpenAI API                          |
| Semantic caching           | Cache common questions/responses                |
| Confidence-based fallbacks | If `confidence &lt; 0.6`, ask for clarification |
| Role-aware responses       | Different answers for auditor vs. analyst       |

---

## 8. Summary

The `/chat/query` endpoint is the core API for conversational analytics in FacturaScan 360, enabling secure and explainable data interrogation powered by MCP contexts and PostgreSQL views.

Next: See [`09-validation-agent.md`](./09-validation-agent.md) for the rule engine and MCP output format that powers semantic error detection.


