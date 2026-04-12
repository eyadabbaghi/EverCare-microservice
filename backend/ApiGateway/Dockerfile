FROM eclipse-temurin:17
EXPOSE 8089
ADD target/ApiGateway-0.0.1-SNAPSHOT.jar gateway.jar
ENTRYPOINT ["java", "-jar", "gateway.jar"]