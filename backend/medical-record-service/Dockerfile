# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml ./pom.xml
COPY medical-record-service/.mvn medical-record-service/.mvn
COPY medical-record-service/mvnw medical-record-service/mvnw
COPY medical-record-service/mvnw.cmd medical-record-service/mvnw.cmd
COPY medical-record-service/pom.xml medical-record-service/pom.xml
COPY medical-record-service/src medical-record-service/src

WORKDIR /build/medical-record-service
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

ENV SERVER_PORT=8082 \
    SPRING_CONFIG_IMPORT=optional:configserver:http://host.docker.internal:8888 \
    EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://host.docker.internal:8761/eureka/ \
    SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/EverCaredb?createDatabaseIfNotExist=true \
    SPRING_DATASOURCE_USERNAME=root \
    SPRING_DATASOURCE_PASSWORD= \
    USER_SERVICE_URL=http://host.docker.internal:8096/EverCare \
    SPRING_RABBITMQ_HOST=host.docker.internal \
    SPRING_RABBITMQ_PORT=5672 \
    SPRING_RABBITMQ_USERNAME=guest \
    SPRING_RABBITMQ_PASSWORD=guest

COPY --from=build /build/medical-record-service/target/medical-record-service-*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
