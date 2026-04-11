FROM eclipse-temurin:17

EXPOSE 8085

ADD target/appointment-service-0.0.1-SNAPSHOT.jar appointment.jar

ENTRYPOINT ["java", "-jar", "appointment.jar"]