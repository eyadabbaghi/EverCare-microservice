export default () => ({
  port: 8096,
  serviceName: process.env.SERVICE_NAME || 'user-service',
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  keycloak: {
    authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads/profile-pictures',
    baseUrl: process.env.BASE_URL || 'http://localhost:8096',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
});
