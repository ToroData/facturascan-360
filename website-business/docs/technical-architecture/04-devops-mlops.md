---
id: devops-mlops
title: 4. DevOps and MLOps Strategy
---

# Scalable DevOps and MLOps Strategy – FacturaScan 360

## Overview

This document defines the DevOps and MLOps strategy for *FacturaScan 360*, supporting a modular SaaS system built on AWS that includes OCR, semantic validation, and future ML modules. The goal is to automate deployment, testing, monitoring, and ML lifecycle management while ensuring robustness, traceability, and scalability.

---

## 1. CI/CD Pipeline

A continuous integration and deployment workflow is implemented using **GitHub Actions** (or optionally GitLab CI). It includes the following stages:

### 1.1. Stages

| Stage         | Purpose                                               |
|---------------|--------------------------------------------------------|
| **Linting**   | Enforce PEP8/Black standards for Python               |
| **Testing**   | Run unit, integration, and regression tests (pytest)  |
| **Build**     | Build Docker images for backend, workers, ML services |
| **Deploy**    | Deploy to staging or production using Git tags        |
| **Notification** | Send Slack/email alerts on failure or success        |

### 1.2. Example GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  build-test-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Lint
        run: black --check .
      - name: Run tests
        run: pytest tests/
      - name: Build and push Docker image
        run: docker build -t facturascan360/backend .
      - name: Deploy
        run: ./deploy.sh
```

---

## 2. Infrastructure as Code (IaC)

All infrastructure is defined and versioned using **Terraform** or **AWS CDK**. This includes:

* IAM roles and policies
* Lambda functions, Step Functions, API Gateway
* S3 buckets and encryption settings
* PostgreSQL (RDS) instances and parameter groups
* Cognito user pool configuration

### 2.1. Terraform Module Structure (example)

```plaintext
infra/
├── main.tf
├── modules/
│   ├── s3/
│   ├── textract/
│   ├── rds/
│   └── lambdas/
└── environments/
    ├── staging.tfvars
    └── production.tfvars
```

---

## 3. Containerization and Deployment

### 3.1. Containerization

* All microservices (validation engine, dashboard backend, ML services) are containerized using **Docker**.
* Base images are minimal (e.g., `python:3.9-slim`) for security and performance.

### 3.2. Deployment Options

| Component          | Platform              | Deployment Strategy                           |
| ------------------ | --------------------- | --------------------------------------------- |
| Backend API        | ECS Fargate / EC2     | Rolling updates via GitHub Actions            |
| Parser / Validator | AWS Lambda            | Event-driven, packaged via `zip` or container |
| ML microservices   | ECS / Lambda (future) | Separate container, exposed via internal API  |

---

## 4. Monitoring and Alerting

Monitoring is implemented using a combination of **Amazon CloudWatch** and **Sentry**.

### 4.1. CloudWatch

| Metric                           | Triggered Alert                                                        |
| -------------------------------- | ---------------------------------------------------------------------- |
| Lambda error rate > 1%           | Email alert to [devops@facturascan.com](mailto:devops@facturascan.com) |
| OCR response time > 5s           | Slack alert in #dev-monitoring                                         |
| Invoice validation failure spike | Alert with details on input anomalies                                  |
| RDS connection count threshold   | Warning email (possible DB saturation)                                 |

### 4.2. Structured Logging

* JSON logs emitted by all services with fields: `tenant_id`, `user_id`, `trace_id`, `action`, `result`, `latency_ms`.
* Logs routed to CloudWatch and optionally to external ELK/Grafana stack.

### 4.3. Sentry

* Frontend and backend exceptions reported in real time.
* Grouped by route, exception type, and frequency.

---

## 5. MLOps Strategy

Although not included in the MVP, the platform is designed to integrate ML modules (fraud detection, anomaly ranking). The MLOps pipeline includes:

### 5.1. Model Versioning

| Component         | Tool           | Purpose                             |
| ----------------- | -------------- | ----------------------------------- |
| Model artifacts   | MLflow / S3    | Track versions, parameters, metrics |
| Metadata registry | DVC or MLflow  | Hash and schema validation          |
| Serving logic     | REST interface | Stateless container with `/predict` |

### 5.2. Offline Retraining Pipeline

* Scheduled jobs run on batch datasets in S3.
* Metrics and artifacts stored with version tags.
* Retraining jobs can be triggered manually or via performance drift detection.

### 5.3. A/B Testing Framework (future)

* Experimental deployments with traffic split (e.g., 90% control / 10% variant).
* Compare:

  * Prediction latency
  * Accuracy of validation improvement
  * False positive/negative impact on alerts

---

## 6. Microservice Integration for ML Models

Once deployed, the ML model is integrated as a RESTful microservice:

* Dockerized container deployed on ECS or behind API Gateway.
* Input: normalized invoice data (`supplier`, `vat`, `total`, etc.)
* Output: prediction (e.g., fraud\_score, anomaly\_flag, consistency\_probability)
* Consumed asynchronously by validator pipeline.

---

## 7. Test Automation

Testing is enforced at multiple levels:

| Layer              | Tools                                      | Scope                                       |
| ------------------ | ------------------------------------------ | ------------------------------------------- |
| **Unit testing**   | `pytest` + coverage                        | Parser, validators, alerts                  |
| **Integration**    | Docker Compose                             | DB, OCR simulation, API                     |
| **Infrastructure** | `terraform validate`, `tflint`, `cfn-lint` | Static analysis of IaC                      |
| **Regression**     | Snapshots of validation output             | Compare with previous baseline              |
| **Load testing**   | Locust / Artillery                         | Stress endpoints under realistic conditions |

---

## 8. Summary

The DevOps and MLOps strategy enables:

* Automated, traceable deployments.
* Isolated, reproducible infrastructure per environment.
* Proactive alerting on errors and degradation.
* ML lifecycle control with retraining and A/B evaluation support.