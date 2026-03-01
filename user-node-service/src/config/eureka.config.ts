export interface EurekaConfig {
  instance: {
    app: string;
    hostName: string;
    instanceId: string;
    ipAddr: string;
    port: {
      $: number;
      '@enabled': boolean;
    };
    vipAddress: string;
    dataCenterInfo: {
      '@class': string;
      name: string;
    };
    metadata?: Record<string, string>;
    statusPageUrl?: string;
    healthCheckUrl?: string;
    homePageUrl?: string;
  };
  eureka: {
    host: string;
    port: number;
    servicePath: string;
    maxRetries: number;
    requestRetryDelay: number;
    fetchRegistry?: boolean;
    registerWithEureka?: boolean;
    preferIpAddress?: boolean;
  };
}

export const getEurekaConfig = (): EurekaConfig => {
  const port = process.env.PORT || 8096;
  const serviceName = process.env.SERVICE_NAME || 'user-service';
  const eurekaServerUrl =
    process.env.EUREKA_SERVER_URL || 'http://localhost:8761/eureka';

  // Parse Eureka server URL
  const eurekaUrl = new URL(eurekaServerUrl);
  const eurekaHost = eurekaUrl.hostname;
  const eurekaPort = parseInt(eurekaUrl.port) || 8761;

  return {
    instance: {
      app: serviceName.toUpperCase(),
      hostName: 'localhost',
      instanceId: `${serviceName}:${port}`,
      ipAddr: '127.0.0.1',
      port: {
        $: parseInt(port.toString()),
        '@enabled': true,
      },
      vipAddress: serviceName,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
      metadata: {
        'spring.application.name': serviceName,
        'server.port': port.toString(),
      },
      statusPageUrl: `http://localhost:${port}/EverCare/actuator/info`,
      healthCheckUrl: `http://localhost:${port}/EverCare/actuator/health`,
      homePageUrl: `http://localhost:${port}/EverCare`,
    },
    eureka: {
      host: eurekaHost,
      port: eurekaPort,
      servicePath: '/eureka/apps/', // CRITICAL: Must be exactly this for Spring Cloud Eureka
      maxRetries: 10,
      requestRetryDelay: 2000,
      fetchRegistry: true,
      registerWithEureka: true,
      preferIpAddress: false,
    },
  };
};
