# Zosterix

**Zosterix** — A Global Platform for Researchers to Blog, Connect, and Collaborate.

Welcome to the main repository for OlaLeafNet. This project is a full-stack platform designed to facilitate collaboration, connection, and idea sharing among researchers worldwide.

## 🚀 Tech Stack

### Backend
*   **Language:** Go (Golang)
*   **Framework:** [Gin](https://gin-gonic.com/) - A fast HTTP web framework for Go.
*   **Database:** MongoDB (via `go.mongodb.org/mongo-driver/v2`) and PostgreSQL
*   **Other Tools:** `godotenv` for environment variable management.

### Frontend
*   **Library:** [React](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling.
*   **Styling:** Tailwind CSS (configured in the frontend app).

## 📂 Project Structure

This repository is structured as a monorepo, containing both the backend and frontend codebases:

```
olaleafnet/
├── backend/            # Go/Gin backend API
│   ├── go.mod          # Go module dependencies
│   ├── main.go         # Backend entry point
│   └── ...
├── frontend/           # React/Vite frontend application
│   ├── package.json    # Frontend dependencies
│   ├── src/            # React source code
│   └── ...
├── .gitignore          # Root-level git ignore rules
└── README.md           # This file
```

## 🛠️ Getting Started

### Prerequisites
*   [Go](https://golang.org/doc/install) (v1.26.1 or later)
*   [Node.js](https://nodejs.org/) (v18 or later)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   MongoDB instance (local or Atlas)

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install Go dependencies:
    ```bash
    go mod download
    ```
3.  Set up your environment variables based on a `.env` template (if available).
4.  Run the application:
    ```bash
    go run main.go
    ```

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install NPM dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 📄 License

[Specify License Here - e.g., MIT License]
