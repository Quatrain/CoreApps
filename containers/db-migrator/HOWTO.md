# How-To Guide: Deploying and Extending @quatrain/db-migrator

---

## 1. Building the Container Image

Using Docker:
```bash
docker build -t qtrn.io/quatrain/db-migrator:latest -f containers/db-migrator/ContainerFile containers/db-migrator
```

Using Podman:
```bash
podman build -t qtrn.io/quatrain/db-migrator:latest -f containers/db-migrator/ContainerFile containers/db-migrator
```

---

## 2. Docker Compose Integration

In your application stack (e.g., in Brad or TotalYmage), configure `db-migrator` as an initialization step so that your API services start only after migrations succeed:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d app_db"]
      interval: 2s
      timeout: 5s
      retries: 10

  db-migrator:
    image: qtrn.io/quatrain/db-migrator:latest
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:secretpassword@db:5432/app_db?sslmode=disable
      MIGRATIONS_DIR: /app/migrations
      TRACKING_SCHEMA: public
      TRACKING_TABLE: schema_migrations
    volumes:
      - ./migrations:/app/migrations:ro

  api:
    image: my-app-api:latest
    depends_on:
      db-migrator:
        condition: service_completed_successfully
    # ...
```

---

## 3. Kubernetes InitContainer Recipe

In Kubernetes deployment manifests or Helm charts, use `db-migrator` as an `initContainer`:

```yaml
spec:
  initContainers:
    - name: schema-migrator
      image: qtrn.io/quatrain/db-migrator:v1.0.0
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: MIGRATIONS_DIR
          value: /app/migrations
      volumeMounts:
        - name: migration-scripts
          mountPath: /app/migrations
          readOnly: true
  containers:
    - name: app-backend
      # ...
```

---

## 4. Extending for Other Database Engines

To add support for another SQL dialect (e.g. `mysql`, `sqlite`, etc.):

1. **Implement `DatabaseMigrationAdapterInterface`**:
   Create `src/adapters/MysqlMigrationAdapter.ts`:
   ```typescript
   import type { DatabaseMigrationAdapterInterface, MigrationConfig, MigrationExecutionResult } from '../types'

   export class MysqlMigrationAdapter implements DatabaseMigrationAdapterInterface {
     readonly dialect = 'mysql'

     constructor(private readonly config: MigrationConfig) {}

     async connect(): Promise<void> { /* ... */ }
     async disconnect(): Promise<void> { /* ... */ }
     async ensureTrackingTable(): Promise<void> { /* ... */ }
     async getAppliedVersions(): Promise<Set<string>> { /* ... */ }
     async executeMigration(version: string, name: string, sqlContent: string): Promise<MigrationExecutionResult> { /* ... */ }
   }
   ```

2. **Register in `src/adapters/index.ts`**:
   ```typescript
   case 'mysql':
     return new MysqlMigrationAdapter(config)
   ```

3. **Configure at runtime**:
   ```bash
   DB_DIALECT=mysql DATABASE_URL=mysql://... bun run dist/index.js
   ```
