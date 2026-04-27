export const config = {
  baseUrl: process.env.BASE_URL ?? 'https://the-internet.herokuapp.com',
  basicAuth: {
    username: process.env.BASIC_AUTH_USER ?? 'admin',
    password: process.env.BASIC_AUTH_PASS ?? 'admin',
  },
  formAuth: {
    username: process.env.FORM_AUTH_USER ?? 'tomsmith',
    password: process.env.FORM_AUTH_PASS ?? 'SuperSecretPassword!',
    invalidUsername: 'wronguser',
    invalidPassword: 'wrongpass',
  },
  dashboard: {
    port: Number(process.env.DASHBOARD_PORT ?? 4000),
    dbPath: process.env.DASHBOARD_DB_PATH ?? 'dashboard/data/results.db',
  },
} as const;
