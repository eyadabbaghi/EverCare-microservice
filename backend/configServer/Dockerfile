FROM eclipse-temurin:17
EXPOSE 8888
ADD target/configServer-0.0.1-SNAPSHOT.jar config.jar
ENTRYPOINT ["java", "-jar", "config.jar"]