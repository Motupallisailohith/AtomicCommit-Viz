# 🌐 Distributed Two-Phase Commit (2PC) System
Atomic Transactions at Scale | Fault-Tolerant Architecture | Real-Time Monitoring

✅ Distributed systems design  
✅ Fault tolerance & consensus protocols  
✅ Modern full-stack development (Node.js + React)  
✅ Real-time monitoring & debugging



## 🏗️ Architecture

![System Architecture](https://github.com/Motupallisailohith/AtomicCommit-Viz/blob/master/Actors.png)

- **Coordinator:** Orchestrates transactions, manages protocol phases, and ensures atomicity.
- **Participants (Nodes):** Receive instructions, vote on transactions, and commit/abort based on consensus.
- **Frontend UI:** Real-time dashboard for monitoring, visualizing, and controlling distributed transactions.

| Component          | Role                                                                 | Tech Stack           |
|--------------------|---------------------------------------------------------------------|----------------------|
| **Coordinator**    | Orchestrates prepare/commit phases, ensures atomicity               | Node.js, Express     |
| **Participants**   | Vote on transactions, handle timeouts & crashes                    | Node.js, REST API    |
| **Frontend**       | Real-time transaction visualization & fault injection              | React, Vite, WebSocket |

## ⚙️ Features

- **Full 2PC Protocol:** Prepare & Commit/Abort phases, with robust error handling and recovery.
- **Fault Injection:** Simulate node crashes, timeouts, and random aborts for resilience testing.
- **Real-Time Monitoring:** WebSocket-powered React dashboard for live transaction tracking.
- **Configurable Topology:** Easily add/remove nodes and adjust timeouts/downtimes.
- **Comprehensive Logging:** Transaction status and event logs at every stage.
- **RESTful API:** Clean endpoints for integration and testing.

---

## 🌍 Real-World Use Cases

- **Banking:** Atomic multi-account transfer.
- **Distributed Databases:** Ensuring consistency across shards.
- **Cloud Storage:** Coordinated updates across regions.
- **Microservices:** Reliable event and data propagation.

---

## 🚦 2PC Protocol Flow

1. **Prepare Phase:**  
   Coordinator asks all nodes if they can commit.
2. **Voting:**  
   Each node replies YES (ready) or NO (cannot commit).
3. **Commit/Abort Phase:**  
   - If all YES: Coordinator sends COMMIT.
   - If any NO or timeout: Coordinator sends ABORT.

---

## 🛠️ Quickstart

### 1. **Clone & Install**

git clone https://github.com/yourusername/yourrepo.git
cd yourrepo
npm install
cd my-2pc-ui
npm install

### 2. **Start Backend Nodes**

In separate terminals:


### 2. **Start Backend Nodes**

In separate terminals:

Coordinator
node coordinator/tcServer.js

Node One
node nodeone/p1server.js

Node Two
node nodetwo/p2server.js

### 3. **Start Frontend**
cd my-2pc-ui
npm run dev
