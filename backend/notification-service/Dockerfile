FROM eclipse-temurin:17
EXPOSE 8097
ADD target/notification-service-0.0.1-SNAPSHOT.jar notification.jar
ENTRYPOINT ["java", "-jar", "notification.jar"]