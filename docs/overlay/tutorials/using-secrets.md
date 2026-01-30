# Using Secrets

This page explains how to consume Vault secrets in overlay E2E tests.

## Where Secrets Come From

In OpenShift CI, Vault secrets are exported as environment variables with the `VAULT_` prefix.

## Vault Setup (CI)

### Secret Naming Convention

All secrets must start with the `VAULT_` prefix (e.g., `VAULT_API_KEY`).

### Global Secrets

Global secrets are available to **all** workspace tests. Use these for shared values.

**Vault Path:** [Global Secrets](https://vault.ci.openshift.org/ui/vault/secrets/kv/kv/selfservice%2Frhdh-plugin-export-overlays%2Fglobal/details)

### Workspace-Specific Secrets

Secrets for a specific workspace should be stored here:

```
selfservice/rhdh-plugin-export-overlays/workspaces/<workspace-name>
```

**Example (tech-radar):** [Tech Radar Secrets](https://vault.ci.openshift.org/ui/vault/secrets/kv/kv/selfservice%2Frhdh-plugin-export-overlays%2Fworkspaces%2Ftech-radar/details)

### Required Vault Annotations

Each workspace-specific secret path must include:

```json
{
  "secretsync/target-name": "rhdh-plugin-export-overlays",
  "secretsync/target-namespace": "test-credentials"
}
```

### Requesting Vault Access

If you don't have access, request it in the team-rhdh channel.

## Use in Test Code (Direct Access)

For use in test code (`*.spec.ts`), access secrets directly via `process.env`:

```typescript
test.beforeAll(async ({ rhdh }) => {
  // Direct access - no rhdh-secrets.yaml needed
  const apiKey = process.env.VAULT_API_KEY;

  if (!apiKey) {
    throw new Error("VAULT_API_KEY is not set");
  }

  await rhdh.configure({ auth: "keycloak" });
  await rhdh.deploy();
});
```

## Use in RHDH Configuration Files

To use Vault secrets in `app-config-rhdh.yaml` or `dynamic-plugins.yaml`, you must first add them to `rhdh-secrets.yaml`.

### Step 1: Add to rhdh-secrets.yaml

**tests/config/rhdh-secrets.yaml:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rhdh-secrets
type: Opaque
stringData:
  # Left side: name to use in app-config
  # Right side: reference to Vault secret (with $)
  EXTERNAL_HOST: $VAULT_EXTERNAL_HOST
  MY_PLUGIN_API_KEY: $VAULT_MY_PLUGIN_API_KEY
```

### Step 2: Use in app-config-rhdh.yaml

**tests/config/app-config-rhdh.yaml:**
```yaml
backend:
  reading:
    allow:
      - host: ${EXTERNAL_HOST}
myPlugin:
  apiKey: ${MY_PLUGIN_API_KEY}
```

## Summary

| Where you need it | How to access |
|-------------------|---------------|
| Test code (`*.spec.ts`) | `process.env.VAULT_*` directly |
| RHDH configs | Add to `rhdh-secrets.yaml` first |

## Related Pages

- [CI Pipeline](/overlay/tutorials/ci-pipeline) - CI and Vault setup
- [Configuration Files](/overlay/test-structure/configuration-files) - YAML config flow

## Adding a New Workspace to CI

When adding E2E tests to a new workspace:

1. **Create workspace-specific secret path in Vault:**
   ```
   selfservice/rhdh-plugin-export-overlays/workspaces/<your-workspace>
   ```

2. **Add required annotations:**
   ```json
   {
     "secretsync/target-name": "rhdh-plugin-export-overlays",
     "secretsync/target-namespace": "test-credentials"
   }
   ```

3. **Add secrets with `VAULT_` prefix:**
   ```
   VAULT_YOUR_SECRET: <value>
   ```

4. **Reference secrets in your configuration files**
