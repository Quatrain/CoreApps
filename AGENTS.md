# Quatrain Applications & Visual Studio - Developer & AI Guidelines

This document outlines the visual application design patterns, state management rules, and container metadata standards that AI agents and developers MUST follow when building frontend apps, Visual Studio adapters, and containerized deployments in the `CoreApps` monorepo.

---

## 1. Visual Modeling & Application Layers

When building visual applications (like `@quatrain/studio-web` and `examples/bookstore`) on top of Quatrain packages:

### A. MVC Separation & Headless Controllers
Keep visual components pure and simple. Business states and data validation MUST live in headless, framework-agnostic controllers (from `@quatrain/ui-form` or `@quatrain/ui-list`) rather than inside React component local states.

- ❌ **DO NOT mix heavy modeling and filtering logic directly inside React components:**
  ```tsx
  // ❌ BAD:
  export function ProjectList() {
     const [filters, setFilters] = useState({ status: 'active' }) // Loose UI state
     // ... heavy custom queries inline
  }
  ```

- ✅ **DO delegate to the pre-packaged headless controllers:**
  ```tsx
  // ✅ GOOD:
  import { ListController } from '@quatrain/ui-list'
  
  const controller = new ListController({ collection: 'projects' })
  // React components simply subscribe and render the controller state
  ```

### B. Consistent UI Themes
All client interfaces must use the designated design tokens and component libraries (such as Mantine UI). Ad-hoc custom layouts or inline styles should be strictly avoided.

---

## 2. React Performance & Memoization Guidelines

To prevent performance degradation in interactive UI environments (especially the heavy Visual Modeling canvas):

- **Stable Object References**: Avoid creating new object or array references on every render cycle. This breaks React memoization and causes heavy layout repaints.
  - ❌ **BAD**: `const defaultOptions = { theme: 'dark' }` inside the component body.
  - ✅ **GOOD**: Define static/default options *outside* the component body or memoize them using `useMemo()`.
- **Component Granularity**: Break complex modeling panels down into small, specialized, memoized sub-components (using `React.memo`) so that modifying a single property field doesn't trigger a full re-render of the entire canvas.

---

## 3. Containerization & OCI Metadata Standards

All containerized deployments (`containers/api-gateway` and `containers/studio-image`) MUST adhere to strict Open Containers Initiative (OCI) metadata standards.

### A. Recommended OCI Labels
Every `ContainerFile` (or `Dockerfile`) must declare standard metadata labels in its final stage to ensure full traceability in Kubernetes orchestrators and registries.

```dockerfile
# Final Stage
FROM oven/bun:alpine
WORKDIR /app

# OCI standard labels
LABEL org.opencontainers.image.title="Core Service Name"
LABEL org.opencontainers.image.description="Short, concise summary of this container's responsibility"
LABEL org.opencontainers.image.source="https://github.com/Quatrain/CoreApps"
LABEL org.opencontainers.image.licenses="AGPL-3.0"
LABEL org.opencontainers.image.vendor="Quatrain Technologies"
LABEL org.opencontainers.image.authors="Quatrain Developers <developers@quatrain.com>"
```

### B. Label Directory & Guidelines

| Label Metadata Key | Purpose & Recommendation | Example |
|--------------------|--------------------------|---------|
| `org.opencontainers.image.title` | The human-readable name of the application. | `"Core API Gateway"` |
| `org.opencontainers.image.description` | One-sentence summary of the container's purpose. | `"API Gateway and Cache Proxy"` |
| `org.opencontainers.image.source` | URL to the repository containing the build files. | `"https://github.com/Quatrain/CoreApps"` |
| `org.opencontainers.image.licenses` | Standard SPID identifier for the license. | `"AGPL-3.0"` |
| `org.opencontainers.image.vendor` | The copyright holder / publisher organization. | `"Quatrain Technologies"` |
| `org.opencontainers.image.authors` | Contact details of the maintainers/developers. | `"developers@quatrain.com"` |

---

## 4. Coding Hygiene

- **Clean Imports (Post-Refactoring)**: Always double-check and remove unused imports after refactoring files to prevent bundle bloating and maintain namespace hygiene.
- **Fail-Fast Environment Validation**: Since containerized deployments run in distinct production/staging platforms, all infrastructure environment variables (e.g. `PORT`, `REDIS_URL`) must be validated immediately at start-up. Throw an explicit error and fail-fast if critical configuration variables are missing.
