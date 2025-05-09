#!/bin/bash

set -e

# === CONFIGURACIÓN ===
REPO_NAME="facturascan-360"
BRANCHES=("business-docs" "internal-docs" "external-docs")
DOCS_DIR=("website-business" "website-internal" "website-external")
INIT_CONTENT_FOR="business-docs"

# === FUNCIÓN PARA INICIALIZAR DOCUSAURUS ===
init_docusaurus() {
    local dir=$1
    npx create-docusaurus@latest $dir classic --skip-install
    cd $dir
    npm install
    cd ..
}

# === FUNCIÓN PARA CREAR ESTRUCTURA Y DOCUMENTOS EN BUSINESS ===
populate_business_docs() {
    echo "📂 Creando estructura en $INIT_CONTENT_FOR"

    cd website-business/docs
    mkdir -p product-strategy technical-architecture monetization design-future operations marketing

    echo "# Value Proposition and Segmentation" > product-strategy/value-proposition.md
    echo "# MVP Technical and Functional Design" > product-strategy/mvp-design.md
    echo "# Validation with Real Clients" > product-strategy/client-feedback.md
    echo "# Pitch Deck and Investment Simulations" > product-strategy/pitch-deck.md

    echo "# SaaS Cloud Architecture" > technical-architecture/saas-cloud-architecture.md
    echo "# User Management and Security (Cognito)" > technical-architecture/auth-security.md
    echo "# Relational DB and Analytics Views" > technical-architecture/db-analytics.md

    echo "# SaaS Pricing Model" > monetization/saas-pricing-model.md
    echo "# Billing and Financial Projections" > monetization/billing-projections.md

    echo "# Visual Identity and Tailwind UI" > design-future/visual-identity.md
    echo "# Accessibility and Inclusive UX" > design-future/accessibility.md

    echo "# Data Strategy for AI/MCP" > design-future/data-strategy.md
    echo "# Technical Roadmap: AI, MCP, ERP" > design-future/tech-roadmap.md

    echo "# Legal/Tax Compliance (ES/US)" > operations/legal-compliance.md
    echo "# Internal Tech Docs (DSLs, Specs)" > operations/internal-docs.md
    echo "# External Docs and FAQ" > operations/external-docs.md
    echo "# Tech Support and SLA" > operations/support.md

    echo "# Go-To-Market and First Clients" > marketing/goto-market.md
    echo "# Competitive Benchmarking" > marketing/competitive-advantage.md
    echo "# Partners and Referral Programs" > marketing/partners.md
    cd ../..
}

# === MAIN LOOP ===

for i in ${!BRANCHES[@]}; do
    BRANCH=${BRANCHES[$i]}
    DIR=${DOCS_DIR[$i]}

    echo "🚀 Creando rama $BRANCH"
    git checkout -b $BRANCH

    echo "📦 Instalando Docusaurus en $DIR"
    init_docusaurus $DIR

    if [[ "$BRANCH" == "$INIT_CONTENT_FOR" ]]; then
        populate_business_docs
    fi

    git add .
    git commit -m "Initialize $BRANCH with Docusaurus site"
    git push -u origin $BRANCH
done

echo "✅ Todas las ramas y sitios Docusaurus están configurados correctamente."
