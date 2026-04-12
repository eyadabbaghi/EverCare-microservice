# DailyMe Microservice

DailyMe is my individual Spring Boot microservice in the EverCare architecture. It handles daily entries, daily tasks, journal uploads, alerts, and patient insights.

## Architecture

- Eureka Server: service discovery between microservices
- Config Server: centralized configuration
- API Gateway: frontend entry point
- USER-SERVICE: user data and identity
- DailyMe-service: follow-up and monitoring module
- Angular frontend: consumes APIs through the gateway

## DailyMe Role

DailyMe provides:

- daily entry CRUD
- daily task CRUD and history
- journal upload and retrieval
- DailyMe alerts
- patient dashboard insights and risk scoring

## DailyMe -> USER-SERVICE Communication

DailyMe now calls `USER-SERVICE` through Eureka service discovery using a load-balanced `RestTemplate`.

- Service name: `USER-SERVICE`
- Target endpoint: `/EverCare/users/by-email`
- DailyMe endpoint: `GET /api/daily-entries/users/by-email?email=...`

The DailyMe endpoint forwards the incoming `Authorization` header so it stays compatible with the existing secured user endpoint.

## Security

The platform uses Keycloak and Bearer tokens. DailyMe does not change the existing security architecture and simply forwards the token to `USER-SERVICE` for the cross-service call.

## Docker

Build the jar:

```bash
mvn clean package -DskipTests
```

Build the image:

```bash
docker build -t evercare/dailyme:1.0 .
```

Run the container:

```bash
docker run -p 8098:8098 evercare/dailyme:1.0
```

## My Contribution

My contribution is the `DailyMe-service`, including persistence, alerts, journaling, patient insights, the new USER-SERVICE communication, Docker support, and this module documentation.
