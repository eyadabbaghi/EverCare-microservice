🏥 EverCare — Microservices Healthcare Platform
📌 Overview

EverCare is a distributed microservices-based healthcare platform designed to provide real-time patient monitoring, medical data management, and caregiver assistance.

The system focuses on:

👨‍⚕️ Patient safety and monitoring
📊 Medical data management
⏱️ Real-time event tracking
🤝 Communication between patients, caregivers, and doctors
🏗️ System Architecture

EverCare follows a scalable microservices architecture with clear separation of concerns.

🔧 Core Components
Frontend: Angular
Backend: Spring Boot microservices
Authentication: Keycloak
Messaging: RabbitMQ
Service Communication:
REST APIs
Feign Client (synchronous calls)
RabbitMQ (asynchronous events)
WebSocket (real-time updates)
Databases: MySQL / PostgreSQL
Containerization: Docker
🧩 Microservices Breakdown
👤 1. User & Security Service
Authentication via Keycloak
Role-based access control:
Patient
Doctor
Caregiver
API Gateway protection
🩺 2. Medical Record Service
Patient medical history management
Clinical data storage
Secure medical access
📅 3. Appointment Service
Schedule doctor appointments
Manage availability
Patient-doctor interaction
📝 4. Activity Tracking Service
Track daily patient activities
Monitor engagement levels
Behavioral insights
🔔 5. Notification Service
Real-time alerts
Emergency notifications
Reminder system (medication / appointments)
📰 6. Blog Service
Medical articles and health content
User engagement and comments
📊 7. DailyMe Service
Mood tracking
Daily patient logs
Behavioral analytics
🔐 Security Architecture

Security is enforced at multiple levels:

Identity management via Keycloak
JWT-based authentication
Role-based authorization (RBAC)
API Gateway protection layer
Secure inter-service communication
🔄 Microservices Communication
📡 Synchronous Communication
OpenFeign
Used for direct service-to-service API calls when immediate response is required.
📬 Asynchronous Communication
RabbitMQ
Used for event-driven communication such as:
Notifications
Alerts
Background processing
Decoupled service updates
⚡ Real-Time Communication
WebSocket integration for live updates:
Patient status updates
Caregiver alerts
🛠️ Technologies Used
☕ Java 17
🌱 Spring Boot Microservices
🅰️ Angular
🔐 Keycloak
🐇 RabbitMQ
🐬 MySQL / PostgreSQL
📡 WebSocket
🐳 Docker
🔗 Feign Client
🚀 Key Features
Real-time patient monitoring
Event-driven alert system
Secure authentication & role management
Scalable microservices architecture
Modular healthcare system design
