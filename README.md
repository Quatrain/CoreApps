# Core Applications & Deployments (CoreApps)

> [!IMPORTANT]
> The source of authority is **[git.qtrn.io/quatrain/core-apps](https://git.qtrn.io/quatrain/core-apps)**: issues, pull requests, wiki and CI live there. `github.com/Quatrain/CoreApps` is a read-only mirror.

This monorepo houses all visual dashboard environments, local modeling APIs, API routing proxies, and containerized deployments built on top of the Core framework (by Quatrain).

---

## 🏗️ Repository Architecture

This workspace is managed using Yarn Berry (v4) Workspaces and is organized as follows:

```text
CoreApps/
├── apps/
│   ├── studio-api/      # Local modeling API server (Express/SQLite)
│   └── studio-web/      # Visual developer studio frontend (React/Mantine)
├── containers/
│   ├── api-gateway/     # Traefik & Redis routing gateway container
│   └── studio-image/    # Bundled Visual Environment image
├── examples/
│   └── bookstore/       # Bookstore reference sandbox application
└── bin/
    ├── publish_container.sh # Container build & push to qtrn.io (Forgejo Actions)
    └── push_tag.sh      # Automated release tagging script
```

---

## 🛠️ Local Development

### Prerequisites
To link and resolve package dependencies locally, the **`Core`** repository MUST be cloned in a sibling directory:
```text
CODE/QUATRAIN/
├── Core/            # Foundation library packages
└── CoreApps/        # Applications & deployments (this repository)
```

All package linkages (`@quatrain/*`) are automatically mapped from the `Core` sibling packages via `portal:` resolutions.

### Setup and Installation
Install dependencies and link workspaces:
```bash
yarn install
```

### Running the Workspaces
Start all development environments concurrently:
```bash
yarn dev
```

### Compiling
Build all applications and container setups sequentially:
```bash
yarn build
```

---

## 🚀 Versioning & Deployment

Deployments and releases are automated via Forgejo Actions on [git.qtrn.io](https://git.qtrn.io/quatrain/core-apps); images are published to the sovereign registry `qtrn.io/quatrain/*`:

* **Release Tagging**: Run the `bin/push_tag.sh` script to bump the monorepo version patch, create a Git tag, and push it to the remote.
* **API Gateway Image**: `.forgejo/workflows/publish-api-gateway.yaml` runs `bin/publish_container.sh api-gateway`.
* **Studio Environment Image**: `.forgejo/workflows/publish-studio-image.yaml` runs `bin/publish_container.sh studio-image`.
* Pushes to `develop` publish `:develop` and `:sha-<commit>`; pushes to `main` bump the patch version, publish `:<version>` and `:latest`, and tag `<container>-v<version>`. Secrets `REGISTRY_USER` and `REGISTRY_TOKEN` are required.
* Images are multi-arch (`linux/amd64` and `linux/arm64`), built with `docker buildx` on the arm64 runners: arm64 layers build natively, amd64 layers under QEMU emulation.

---

## ⚖️ License
Licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.
