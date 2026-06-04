# Quatrain Core Studio Container Image

This container packages the **Quatrain Core Studio** application, which bundles the visual developer studio dashboard (`@quatrain/studio-web`) and the backend API controller (`@quatrain/studio-api`).

## 🚀 Service Access URL
Once the container is running, the Core Studio is available at:
* **UI & API Gateway**: [http://localhost:4000](http://localhost:4000)

## 🔑 Default Credentials

By default, authentication is handled via environment variables passed to the container:
* **Username**: `admin` (or defined via `STUDIO_AUTH_USER`)
* **Password**: `secret123` (or defined via `STUDIO_AUTH_PASS`)

> [!NOTE]
> To enable Basic Authentication, uncomment the `STUDIO_AUTH_USER` and `STUDIO_AUTH_PASS` environment variables in your `compose.yaml`. If not defined, the application falls back to these defaults.

## 🛠️ Storage & Persistence
The container uses two volumes for data persistence:
* `/app/data`: Stores the SQLite database state (`quatrain-studio.sqlite`).
* `/app/storage`: Stores the local assets and documents.

## 🐳 Deployment & Execution

You can run the container using the provided `compose.yaml`:

```bash
# Start the service
podman compose up -d

# Stop the service
podman compose down
```

## ⚙️ Configuration Parameters

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port the server listens on inside the container. |
| `SERVE_FRONTEND` | `true` | Serves the `@quatrain/studio-web` static assets from `/api`. |
| `STUDIO_DATA_DIR` | `/app/data` | Path to the SQLite database storage. |
| `STUDIO_STORAGE_DIR` | `/app/storage` | Path to the local file storage directory. |
| `STUDIO_AUTH_USER` | `admin` | Username for basic authentication. |
| `STUDIO_AUTH_PASS` | `secret123` | Password for basic authentication. |
