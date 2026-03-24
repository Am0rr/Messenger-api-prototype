# Messenger API 🚀

A robust RESTful API for real-time messaging with an integrated content moderation system. Built as part of a software engineering laboratory project.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Containerization:** Docker & Docker Compose
- **Testing:** Postman / Jest (In Progress)

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and [Docker](https://www.docker.com/) installed on your machine.

### 2. Install Dependencies

```
npm install
```

### 3. Environment Setup

Create a .env file in the root directory and configure your credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=Top
DB_PASSWORD=12345
DB_NAME=MessengerDb
PORT=3000
```

### 4. Infrastructure (Docker)

Spin up the PostgreSQL instance:

```
docker compose up -d
```

### 5. Run the Server

The database schema will be initialized automatically on startup:

```
npx tsx backend/src/main.ts
```

The API will be available at: http://localhost:3000

---

## 📡 API Endpoints

Messaging & Users

- POST /api/users — Register a new user
- POST /api/conversations — Create a new chat session
- POST /api/messages — Send a message

- GET /api/messages/:conversationId — Retrieve message history

Moderation (Feature in Progress)

- POST /api/reports — Report a specific message for review
- POST /api/moderation/ban — Administrative action to hide content

---

## 🏗 System Architecture

Component Diagram

```mermaid
graph TD
Client[Client] --> API(API)
API --> Auth(Auth)
API --> MessageService(MessageService)

    MessageService --> DB[(MessageDB)]
    MessageService --> Queue(Queue)

    Queue --> DeliveryService(DeliveryService)
    DeliveryService --> Client

    API --> ModerationService(ModerationService)
    ModerationService --> ReportDB[(ReportDB)]

    ModerationService --> Queue
    AdminPanel(AdminPanel) --> ModerationService
    ModerationService --> MessageService
```

Moderation Workflow (Sequence)

```mermaid
sequenceDiagram
autonumber

    actor User as Angry User
    participant Client
    participant API
    participant Mds as Moderation Service
    participant Msg as Message Service
    participant ReportDB
    participant MessageDB
    participant Admin

    User->> Client: Send Report
    Client->>API: POST /reports {msgId: 123}
    API->>Mds: createReport()
    Mds->>ReportDB: INSERT INTO reports
    ReportDB-->>Mds: OK (Report ID: 99)
    Mds-->>API: 201 Created
    API-->>Client: 200 OK
    Admin->>Mds: POST /ban {reportId: 99}
    Mds->>Msg: hideMessage(msgId: 123)
    Msg->>MessageDB: UPDATE status='HIDDEN'
    MessageDB-->>Msg: OK
    Msg-->>Mds: Success
    Mds-->>Admin: 200 OK "Message Hidden"
```

Message Life Cycle (State)

```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> Sent
    Sent --> Delivered
    Delivered --> Read

    state "Under Review (Reported)" as Reported

    Read --> Reported : User reports msg
    Sent --> Failed
    Failed --> Retried
    Retried --> Sent

    Reported --> Hidden : Admin bans content
    Reported --> Verified : Admin rejects report

    Hidden --> [*]
    Verified --> [*]
```
