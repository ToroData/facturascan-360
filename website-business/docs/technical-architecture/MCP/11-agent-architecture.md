---
id: agent-architecture
title: 11. MCP Agent Architecture and Orchestration
---

# MCP Agent Architecture – Global Orchestration Model

## Overview

FacturaScan 360 is architected around a distributed system of intelligent **MCP-compliant agents**, each responsible for a distinct processing stage. These agents operate over well-defined semantic contexts (MCP), enabling loosely coupled AI services to interact via JSON-based structures, rather than tight procedural integration.

This document describes the agent topology, invocation strategy, lifecycle, and auditability mechanisms.

---

## 1. Agent Types and Responsibilities

| Agent Name           | Input Context       | Output Context        | Responsibility                           |
|----------------------|---------------------|------------------------|-------------------------------------------|
| `ParserAgent`        | Textract JSON       | `InvoiceContext`       | Normalize OCR data into semantic fields   |
| `ValidationAgent`    | `InvoiceContext`    | `ValidationContext`    | Apply rule-based semantic validations     |
| `AnalyticsAgent`     | `InvoiceContext`    | `AnalyticsContext`     | Compute trends, flags, business insights  |
| `ChatAgent`          | `AnalyticsContext`  | Natural language       | Generate conversational responses         |
| `AlertAgent` (future)| `ValidationContext` | Email / webhook        | Trigger critical warnings                 |
| `ClassifierAgent` (optional) | Raw or Parsed | Category, supplier type| Classify invoices for routing             |

---

## 2. Execution Topology

![Execution Topology](../static/images/mcp-execution-topology.png)

* **Push-based** orchestration via **Step Functions**
* Agents produce immutable MCP contexts persisted in database
* Chat agent operates **pull-based**, triggered by user query

---

## 3. Invocation and Isolation

| Mode                      | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| **Synchronous Lambda**    | Low-latency parsing or validation                         |
| **Asynchronous (StepFn)** | Decoupled, ordered flow (OCR → Validate → Analyze)        |
| **Manual API trigger**    | Agent can be retriggered via admin interface (idempotent) |
| **ECS Microservices**     | Long-running agents with ML models or BI caches           |

Each agent has its own deployment artifact, version, and log stream.

---

## 4. Agent Lifecycle and State

All agents follow the same logical lifecycle:

1. Receive input context (`InvoiceContext`, etc.)
2. Validate schema and MCP version compatibility
3. Execute logic (rules, ML inference, DB lookup, etc.)
4. Generate output context with metadata:

   * `agent`: name + version
   * `timestamp`
   * `input_reference`
   * `derived_fields`
5. Store output context in `invoices` table (JSONB)

---

## 5. Failure and Retry Strategy

| Failure Type               | Strategy                                       |
| -------------------------- | ---------------------------------------------- |
| Schema mismatch            | Log, reject, alert devops                      |
| Processing timeout         | Retry up to 3 times (StepFn backoff)           |
| Data dependency missing    | Fallback to raw data (e.g., retry ParserAgent) |
| ChatAgent confidence < 0.5 | Prompt user for clarification                  |

All agent invocations are logged in `agent_logs` table.

---

## 6. Agent Logs Schema (for audit)

```sql
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY,
    agent_name TEXT,
    agent_version TEXT,
    invoice_id UUID,
    input_context_type TEXT,
    output_context_type TEXT,
    success BOOLEAN,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

## 7. Agent Scaling Strategy

| Agent           | Scaling Model             | Rationale                          |
| --------------- | ------------------------- | ---------------------------------- |
| ParserAgent     | Lambda or ECS burst       | Depends on volume of OCR output    |
| ValidationAgent | Stateless, parallelizable | CPU-bound, rules only              |
| AnalyticsAgent  | ECS or batch jobs         | Requires access to invoice history |
| ChatAgent       | On-demand via FastAPI     | Used only upon user interaction    |
| AlertAgent      | Event-based Lambda        | Low frequency, high priority       |

---

## 8. Summary

FacturaScan 360’s AI architecture is designed around independently deployable, semantically aware **agents** that operate over structured contexts (`InvoiceContext`, `ValidationContext`, `AnalyticsContext`). This modular approach allows:

* Full traceability per agent and decision
* Scalable deployment across AWS services
* Conversational and programmatic access to intelligence
* Evolution of each agent independently via versioned logic

The MCP and agent orchestration together form the semantic backbone of the FacturaScan 360 intelligence layer.
