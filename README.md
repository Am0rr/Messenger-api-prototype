# Messenger API 🚀

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat&logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178C6?style=flat&logo=typescript)
![Express](https://img.shields.io/badge/Express.js-v5.0-000000?style=flat&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v8.x-4169E1?style=flat&logo=postgresql)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-v1.x-FF6600?style=flat&logo=rabbitmq)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker)

A robust RESTful API for real-time messaging with an integrated content moderation system. Built as part of a software engineering laboratory project.

## 🛠 Tech Stack

* **Runtime:** Node.js (v20+)
* **Language:** TypeScript
* **Framework:** Express.js (with custom middleware pipeline)
* **Database:** PostgreSQL (Relational storage)
* **Data Validation:** Zod (Type-safe schema validation)
* **Message Broker:** RabbitMQ (Asynchronous background processing)
* **Containerization:** Docker & Docker Compose
* **Testing:** Jest (Unit/Integration) & Postman (API Lifecycle)

## 📡 API Endpoints

### Messaging & Users

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/users` | Register a new user account |
| `POST` | `/api/conversations` | Create a new chat session (direct or group) |
| `POST` | `/api/messages` | Send a message to a conversation (triggers RabbitMQ event) |
| `GET` | `/api/messages/:conversationId` | Retrieve historical message log for a specific conversation |
| `DELETE` | `/api/messages/:messageId` | Soft/hard delete a specific message |

### Content Moderation (Admin / Moderator Only)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/reports` | Report a specific message for violating guidelines |
| `GET` | `/api/reports` | List all unsolved reports pending review |
| `PUT` | `/api/reports/:reportId/take` | Claim a report for investigation (marks as 'solving') |
| `PUT` | `/api/reports/:reportId/resolve` | Confirm violation: resolve report and hide the message |
| `PUT` | `/api/reports/:reportId/reject` | Dismiss violation: reject report and whitelist the message |

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v20 LTS or higher)
* [Docker](https://www.docker.com/) & Docker Compose
* Git

### 1. Clone & Install Dependencies

```bash
git clone [https://github.com/your-username/messenger-api.git](https://github.com/your-username/messenger-api.git)
cd messenger-api
npm install

```

### 2. Environment Setup

Create a `.env` file in the root directory based on `.env.example`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=MessengerDb
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### 3. Spin Up Infrastructure

Launch the containerized PostgreSQL database and RabbitMQ broker using Docker Compose:

```bash
docker compose up -d
```

> ⏳ *Please allow 5–10 seconds for RabbitMQ to fully initialize its internal exchanges and queues before booting up the server.*

### 4. Run the Application

The system automatically applies schema initializations and triggers required database connections on startup:

```bash
# Run in development mode with hot-reload (Nodemon + ts-node)
npm run dev

# Build the project (TypeScript compilation)
npm run build

# Run the compiled production build
npm start
```

The API will safely accept requests at: `http://localhost:3000`

---


## 🏗 System Architecture

The system utilizes an asynchronous event-driven approach. Heavy tasks like status updates and notification processing are offloaded to background consumers via **RabbitMQ** to keep the API layer highly responsive.

Component Diagram

```mermaid
graph TD

    subgraph ClientSide
        Client[Client] 
        AdminPanel(Admin Panel) 
    end

    subgraph Infrastructure
        DB[(PostgreSQL)]
        Queue((RabbitMQ))
    end

    subgraph NodeBackend [Node.js Backend]
        API(Express API)
        Validation(Zod Validation Middleware)

        subgraph MainRoutes [Main Business Logic]
            direction TB
            Messages(Message Routes)
            Conversation(Conversation Routes)
            Users(User Routes)
            Reports(Report Routes)
        end

        API --> Validation
        Validation --> MainRoutes
        
        subgraph Consumers [Workers]
            direction TB
            MessageWorker(Message Consumer)
            ReportWorker(Report Consumer)
        end
    end

    Client --> API
    AdminPanel --> API

    Messages -->|Read/Write| DB
    Reports -->|Read/Write| DB
    Conversation -->|Read/Write| DB
    Users -->|Read/Write| DB

    Messages -.->|Publish 'sent'| Queue
    Reports -.->|Publish| Queue

    Queue -.->|Consume| MessageWorker
    Queue -.->|Consume| ReportWorker

    MessageWorker -->|Update status| DB
    ReportWorker -->|Ack/Process| DB
```

Moderation Workflow (Sequence)

```mermaid
sequenceDiagram
    autonumber

    actor User as Angry User
    participant Client
    participant API as Express API
    participant Service as Report Service
    participant DB as PostgreSQL
    participant MQ as RabbitMQ
    participant AP as Admin Panel
    actor Admin

    User->>Client: Report a message
    Client->>API: POST /api/reports {messageId, ...}
    
    Note over API: Zod Schema Validation
    alt Data is Invalid
        API-->>Client: 400 Bad Request (Zod Error)
    else Data is Valid
        API->>Service: createReport(...)
        
        rect rgb(60, 60, 60)
        Note right of Service: SQL Transaction (BEGIN)
        Service->>DB: Verify message, user, conversation
        Service->>DB: INSERT INTO reports
        Service->>DB: UPDATE messages SET status = 'reported'
        DB-->>Service: COMMIT (OK)
        end
        
        Service->>MQ: Publish 'REPORT_CREATED' to report_queue
        Service-->>API: "Your report was created successfully."
        API-->>Client: 201 Created {message}
        Client-->>User: Success UI Notification
    end

    Admin->>AP: Open unsolved reports
    AP->>API: GET /api/reports?status=unsolved
    API->>Service: getReports('unsolved')
    Service->>DB: SELECT * FROM reports WHERE status='unsolved'
    DB-->>Service: reports array
    Service-->>API: reports array
    API-->>AP: 200 OK [reports]
    AP-->>Admin: Show list of reports

    Admin->>AP: Take report in work
    AP->>API: PUT /api/reports/{reportId}/take
    API->>Service: takeReportInWork(reportId)
    Service->>DB: UPDATE reports SET status='solving'
    DB-->>Service: OK
    Service-->>API: "Report {id} marked as 'solving'."
    API-->>AP: 200 OK {message}
    AP-->>Admin: Update UI status

    Admin->>AP: Review report content
    
    alt Verdict: Resolve
        AP->>API: PUT /api/reports/{reportId}/resolve
        API->>Service: resolveAndHideMessage()
        Service->>DB: BEGIN: Update message='hidden', report='solved', COMMIT
        DB-->>Service: OK
        Service-->>API: success message
        API-->>AP: 200 OK
        AP-->>Admin: "Message was hidden"
    else Verdict: Reject
        AP->>API: PUT /api/reports/{reportId}/reject
        API->>Service: rejectReport()
        Service->>DB: BEGIN: Update message='verified', report='solved', COMMIT
        DB-->>Service: OK
        Service-->>API: success message
        API-->>AP: 200 OK
        AP-->>Admin: "Message was verified"
    end
```

Message Life Cycle (State)

```mermaid
stateDiagram-v2
    [*] --> sent : User sends message
    
    sent --> delivered : RabbitMQ Worker (Ack)
    
    delivered --> reported : User creates a report
    
    reported --> hidden : Admin resolves report
    reported --> verified : Admin rejects report
    
    hidden --> [*]
    verified --> [*]
```

## 🧪 Testing

Automated testing checks both HTTP routes and contract validations.

```bash
# Run unit and integration tests via Jest
npm run test
```
