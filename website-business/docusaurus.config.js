// @ts-check
const config = {
  title: 'FacturaScan 360 – Business Documentation',
  tagline: 'AI-driven invoice automation for SMBs',
  url: 'https://torodata.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'ToroData', // GitHub org/user
  projectName: 'facturascan-360', // GitHub repo name

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/ToroData/facturascan-360/edit/business-docs/website-business/',
        },
        blog: false, // Eliminado
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
};

module.exports = config;
