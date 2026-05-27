# Quatrain Studio Recipe

This Tycho recipe deploys **Quatrain Visual Studio**, a modern visual database modeling workspace and interactive dashboard for Quatrain applications, run securely inside a container behind Traefik.

## Features

- **Visual Modeling Canvas**: Design schemas, relations, and business entities in real-time.
- **Rootless & Traefik Ready**: Runs securely in rootless Podman mode with automatic HTTPS provisioning via Traefik.
- **Embedded Database & State**: Persists SQLite database configurations and storage folders.
- **Built-in Authentication**: Protected by default using customizable basic authentication.

## Configuration Parameters

The following environment variables are queried during setup/installation and stored in your `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `STUDIO_SUBDOMAIN` | Subdomain for routing (e.g. `studio.yourdomain.com`). | `studio` |
| `STUDIO_DATA_LOCATION` | Path on host to persist SQLite databases. | `/data/studio/data` |
| `STUDIO_STORAGE_LOCATION` | Path on host to persist local storage files. | `/data/studio/storage` |
| `STUDIO_AUTH_USER` | Admin username for the dashboard basic auth. | `admin` |
| `STUDIO_AUTH_PASS` | Secure password for the admin account. | `ChangeMe123!` |

## Installation

To install this recipe using Tycho (after registering your third-party repository):

```bash
tycho install quatrain-studio
```
