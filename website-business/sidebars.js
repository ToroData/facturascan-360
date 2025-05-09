module.exports = {
  sidebar: [
    {
      type: 'doc',
      id: 'index', // 👈 Añade esta línea para que sea la raíz
      label: 'Welcome',
    },
    {
      type: 'category',
      label: 'Product Strategy and Validation',
      items: [
        'product-strategy/value-proposition',
        'product-strategy/mvp-design',
        'product-strategy/client-feedback',
        'product-strategy/pitch-deck',
      ],
    },
    {
      type: 'category',
      label: 'Technical Architecture and Backend Cloud',
      items: [
        'technical-architecture/saas-cloud-architecture',
        'technical-architecture/auth-security',
        'technical-architecture/db-analytics',
      ],
    },
    {
      type: 'category',
      label: 'Monetization and Financial Scaling',
      items: [
        'monetization/saas-pricing-model',
        'monetization/billing-projections',
      ],
    },
    {
      type: 'category',
      label: 'Design, Accessibility, and UX',
      items: [
        'design-future/visual-identity',
        'design-future/accessibility',
      ],
    },
    {
      type: 'category',
      label: 'Data Science and Future Vision',
      items: [
        'design-future/data-strategy',
        'design-future/tech-roadmap',
      ],
    },
    {
      type: 'category',
      label: 'Operations and Compliance',
      items: [
        'operations/legal-compliance',
        'operations/internal-docs',
        'operations/external-docs',
        'operations/support',
      ],
    },
    {
      type: 'category',
      label: 'Marketing and Commercial Growth',
      items: [
        'marketing/goto-market',
        'marketing/competitive-advantage',
        'marketing/partners',
      ],
    },
  ],
};
