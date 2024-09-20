export default [
  {
      context: [
          '/api',
          '/ecm',
          '/process-management',
          '/ecm-forms',
      ],
      target: 'https://federacaonacional130420.fluig.cloudtotvs.com.br',
      secure: false,
      changeOrigin: true,
      pathRewrite: {
          "^/": ""
      }
  }
]

