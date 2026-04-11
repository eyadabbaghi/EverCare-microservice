export default () => {
  const port = parseInt(process.env.PORT || '8096', 10);
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

  return {
    port,
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
      baseUrl,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
    },
    eureka: {
      enabled: process.env.EUREKA_ENABLED === 'true',
      serverUrl: process.env.EUREKA_SERVER_URL,
      hostname: process.env.EUREKA_HOSTNAME || 'localhost',
      ipAddr: process.env.EUREKA_IP_ADDR || '127.0.0.1',
    },
    rabbitmq: {
      enabled: process.env.RABBITMQ_ENABLED !== 'false',
      url:
        process.env.RABBITMQ_URL ||
        `amqp://${process.env.RABBITMQ_USERNAME || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`,
      medicalRecord: {
        exchange:
          process.env.MEDICAL_RECORD_EXCHANGE || 'medical.record.exchange',
        queue: process.env.MEDICAL_RECORD_QUEUE || 'medical.record.queue',
        routingKey:
          process.env.MEDICAL_RECORD_ROUTING_KEY || 'medical.record.events',
      },
    },
  };
};
