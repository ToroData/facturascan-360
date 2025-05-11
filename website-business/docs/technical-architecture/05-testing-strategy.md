---
id: testing
title: 5. Testing Strategy
---

# Comprehensive Testing Strategy – FacturaScan 360

## Overview

FacturaScan 360 processes financial documents through a modular pipeline involving OCR, semantic validation, alert dispatching, and data storage. To ensure system reliability, a multi-level testing strategy is implemented that spans unit logic, end-to-end integration, realistic inputs, and stress testing.

---

## 1. Unit Testing

Unit tests validate the correctness of individual modules and business logic.

### 1.1. Scope

| Module                 | Tested Functions                         |
|------------------------|------------------------------------------|
| `parser.py`            | Field extraction from Textract JSON      |
| `rules.py`             | Validation rules (e.g., VAT range check) |
| `alerts.py`            | Email formatting, trigger thresholds     |
| `storage.py`           | SQL insertions and integrity constraints |

### 1.2. Framework

- **pytest** with fixture support and coverage reports.
- Custom markers for regression-critical components (`@pytest.mark.critical`).

---

## 2. Integration Testing (E2E)

End-to-end tests ensure the correct orchestration of the full pipeline:

```plaintext
Upload PDF → Textract → Parser → Validator → Alert → DB
```

### 2.1. Use Cases

* Valid invoice → Stored successfully, no alert.
* Invoice with invalid VAT → Stored + triggers error-level alert.
* Duplicate invoice → Detected and logged.
* Malformed PDF → Rejected early with appropriate log entry.

### 2.2. Tools

* **Postman**: Run collections simulating API calls.
* **pytest + Docker Compose**: For service orchestration during test runs.

---

## 3. Mock Testing

Mocking is used to simulate dependencies for fast, deterministic tests.

### 3.1. Mocked Services

| External Service | Tool / Strategy                           |
| ---------------- | ----------------------------------------- |
| AWS Textract     | `moto` library or JSON fixtures           |
| Amazon SES       | SMTP capture service (MailHog / Papercut) |
| AWS Cognito      | Mocked JWT tokens with test claims        |
| S3               | Local filesystem or `moto`                |

### 3.2. Implementation Tips

* Use factory patterns to swap real vs. mock dependencies.
* Validate schema of mocked Textract responses.

---

## 4. Real Data Testing

To evaluate real-world performance and anomalies:

### 4.1. Dataset

* **Synthetic invoices**: Generated to test edge cases (e.g., incorrect VAT).
* **Anonymized real invoices**: Collected from pilot clients under NDA.

### 4.2. Validated Scenarios

| Scenario                    | Expected Outcome              |
| --------------------------- | ----------------------------- |
| Invoice with zero VAT       | No error if in legal category |
| Date in the future          | Triggers warning              |
| Invoice in foreign currency | Marked for review             |
| Subtotal and total mismatch | Critical error                |

---

## 5. Key Metrics to Track

| Metric                                   | Target / Purpose           |
| ---------------------------------------- | -------------------------- |
| OCR accuracy (field-level)               | > 95% (on legible PDFs)    |
| Validation rule detection rate           | 100% of injected anomalies |
| Alert dispatch success rate              | > 99%                      |
| DB consistency (invoice-validation link) | Referential integrity 100% |
| Test coverage (unit/integration)         | ≥ 90% required to pass CI  |

---

## 6. Stress Testing and Performance

### 6.1. Load Scenarios

* Upload 1,000 PDFs in parallel.
* Trigger concurrent validation and alert generation.
* Measure API response times and Lambda cold starts.

### 6.2. Tools

| Purpose              | Tool                       |
| -------------------- | -------------------------- |
| HTTP load generation | **Locust**                 |
| Lambda monitoring    | **CloudWatch**             |
| DB load simulation   | Custom scripts + `pgbench` |

### 6.3. Monitored Metrics

* OCR throughput (pages/minute)
* Avg. API response time under load
* Latency spike alerts
* Lambda scaling events
* Memory and CPU usage (RDS, ECS)

---

## 7. Test Automation in CI/CD

All test stages are integrated into **GitHub Actions** or **GitLab CI**.

### 7.1. Test Steps

| Stage             | Trigger               | Blocking     |
| ----------------- | --------------------- | ------------ |
| Linting (black)   | On every PR           | ✅            |
| Unit tests        | On every PR           | ✅            |
| Integration tests | On `main` push or tag | ✅            |
| Regression tests  | Nightly job           | Optional     |
| Coverage check    | On every PR           | ✅ (min. 90%) |

### 7.2. Example GitHub Action Snippet

```yaml
- name: Run tests
  run: pytest --cov=app tests/
- name: Check coverage
  run: coverage report --fail-under=90
```

---

## 8. Summary

The testing strategy for FacturaScan 360 ensures:

* High test coverage of core logic and edge cases.
* Realistic validation via synthetic and real data.
* Safe integration with external services through mocks.
* Confidence in performance and scale readiness.
* Full CI/CD integration to guarantee code quality and regression protection.
