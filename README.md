# Core Applications & Deployments (CoreApps)

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

Deployments and releases are automated via GitHub Actions:

* **Release Tagging**: Run the `bin/push_tag.sh` script to bump the monorepo version patch, create a Git tag, and push it to the remote.
* **API Gateway Image**: Automated via `.github/workflows/publish-api-gateway.yml` using the composite `Quatrain/actions/prepare-package-json` action to bundle stable, registry-resolved dependencies.
* **Studio Environment Image**: Automated via `.github/workflows/publish-studio-image.yml`.

---

## ⚖️ License
Licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.
