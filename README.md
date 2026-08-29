# Online Voting System - Backend Server (`online_voting_backend`)

Backend services for the **Aadhaar-Based Automated & Remote Electronic Voting System Simulator**, built according to the research paper *"Remotely Connected and Mobile Automated Polling Station for Electronic Voting Using Aadhar Based Authentication"* (Dr. R.V. Krishnaiah & R. Vamsi Krishna, *IJAEMA* 2022).

---

## 🚀 Technologies

- **Node.js / Express.js**: Primary REST API Server (`server.js`)
- **MongoDB / Mongoose**: Central and local constituency schemas (`models.js`)
- **Memory Sandbox Mode**: Built-in fallback in-memory database store for development without requiring external MongoDB
- **Python / Flask**: Alternative lightweight server implementation with SQLite (`server.py`, `voting.db`)

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/voters` | Retrieve central voter registry database |
| `POST` | `/api/voters/auth` | Aadhaar biometric authentication (`Fingerprint OR IRIS`) & duplicate voting check |
| `GET` | `/api/nominations` | List candidate nominations with verification statuses |
| `POST` | `/api/nominations` | File candidate nomination with deposit fee & transaction proof |
| `POST` | `/api/nominations/audit` | Election officer action (Approve / Reject / Withdraw) |
| `GET` | `/api/booths` | List physical and mobile (MPS) polling booth configurations |
| `POST` | `/api/booths` | Register new polling booth gateway & CCTV camera ID |
| `POST` | `/api/vote` | Cast encrypted ballot into database ledger |
| `GET` | `/api/polls` | Retrieve live voting transaction logs and candidate tallies |
| `GET` / `POST` | `/api/settings` | Electoral timeline settings (start/end time, GMT+5:30 offset) |
| `POST` | `/api/super/simulate` | Simulate mass voter turnout (25 random ballots) |
| `POST` | `/api/super/reset` | Clear tallies and reset system to pristine seed state |

---

## 🛠️ How to Run

### 1. Node.js / Express Server (Recommended)
```bash
# Install dependencies
npm install

# Start the server
npm start
# Running on http://localhost:8080
```

### 2. Python / Flask Server (Alternative)
```bash
# Install dependencies
pip install flask

# Start the server
python server.py
# Running on http://localhost:8080
```
