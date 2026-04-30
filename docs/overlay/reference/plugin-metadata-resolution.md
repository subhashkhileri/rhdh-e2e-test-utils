# Plugin Metadata Resolution

::: tip Overlay Documentation
This page explains how plugin packages are resolved in overlay E2E tests. It is specific to `rhdh-plugin-export-overlays`.
:::

The test framework resolves plugin package references before deploying RHDH. This page explains how the resolution works in each mode, what metadata controls, and the common scenarios you'll encounter.

## Modes

The system detects the mode from environment variables:

| Mode | Detection | Use case |
|------|-----------|----------|
| **PR check** | `GIT_PR_NUMBER` is set | CI PR validation |
| **Nightly** | `E2E_NIGHTLY_MODE=true` or `JOB_NAME` contains `periodic-` | Daily CI regression |
| **Local dev** | Neither of the above | Development |

`GIT_PR_NUMBER` always wins — if both it and `E2E_NIGHTLY_MODE` are set, the system runs in PR mode.

## How Resolution Works

Every plugin entry in `dynamic-plugins.yaml` goes through two steps:

### Step 1: Config Injection

Merge `appConfigExamples` from metadata into `pluginConfig`.

- **PR / Local**: metadata config is the base, user `pluginConfig` overrides it (deep merge)
- **Nightly**: skipped entirely — user `pluginConfig` is preserved as-is
- Disabled when `RHDH_SKIP_PLUGIN_METADATA_INJECTION=true`

#### Example: Deep Merge Behavior (PR / Local mode)

```yaml
# metadata/backstage-community-plugin-argocd.yaml
spec:
  appConfigExamples:
    - title: Default
      content:
        dynamicPlugins:
          frontend:
            backstage-community.plugin-argocd:
              mountPoints:
                - mountPoint: entity.page.cd/cards
                  importName: ArgoContent
              entityTabs:
                - path: /cd
                  title: CD
```

```yaml
# tests/config/dynamic-plugins.yaml (user override — only changes mountPoints)
plugins:
  - package: oci://ghcr.io/.../backstage-community-plugin-argocd:old!alias
    pluginConfig:
      dynamicPlugins:
        frontend:
          backstage-community.plugin-argocd:
            mountPoints:
              - mountPoint: entity.page.cd/cards
                importName: CustomArgoContent    # overrides ArgoContent
```

```yaml
# Result after merge (metadata base + user override)
plugins:
  - package: oci://ghcr.io/.../backstage-community-plugin-argocd:bs_1.49.4__2.4.3!alias
    pluginConfig:
      dynamicPlugins:
        frontend:
          backstage-community.plugin-argocd:
            mountPoints:
              - mountPoint: entity.page.cd/cards
                importName: CustomArgoContent    # from user (wins)
            entityTabs:
              - path: /cd
                title: CD                        # from metadata (preserved)
```

| Scenario | Result |
|----------|--------|
| Metadata has config, user has none | Metadata config injected as `pluginConfig` |
| Metadata has config, user has partial override | Deep merge — user keys win, metadata fills the rest |
| Metadata has config, user overrides same key | User value wins |
| No `appConfigExamples` in metadata | No `pluginConfig` injected |
| **Nightly mode** | **Skipped** — user `pluginConfig` preserved exactly as-is, metadata config NOT merged |

### Step 2: Package Resolution

Replace the `package` field using metadata as the source of truth.

For each plugin, the resolver checks in order:

```
1. Has metadata?
   No  → keep package unchanged (cross-workspace plugin, npm package, etc.)
   Yes ↓

2. Is GIT_PR_NUMBER set AND this plugin is in the workspace build?
   Yes → replace with PR OCI URL:  oci://ghcr.io/.../plugin:pr_{number}__{version}
   No  ↓

3. Use metadata's dynamicArtifact as-is
   (OCI ref → OCI ref, wrapper path → wrapper path)
```

Metadata is always the source of truth for the package reference. Whatever `spec.dynamicArtifact` says — OCI ref or wrapper path — that's what the plugin resolves to.

## Resolution Scenarios

The tables below show what happens to each plugin type in PR check and nightly modes. Local dev behaves the same as nightly for package resolution, and the same as PR check for config injection.

### PR Check Mode (`GIT_PR_NUMBER` set)

| # | Scenario | Metadata `dynamicArtifact` | User config `package` | Resolved `package` | Config injection |
|---|----------|---------------------------|----------------------|---------------------|-----------------|
| 1 | Workspace plugin (OCI) | `oci://ghcr.io/.../plugin-tekton:bs_1.49.4__3.33.3!alias` | `oci://ghcr.io/.../plugin-tekton:old_tag!alias` | `oci://ghcr.io/.../plugin-tekton:pr_1845__3.33.3!alias` | Yes (metadata base + user override) |
| 2 | Workspace plugin (wrapper) | `./dynamic-plugins/dist/plugin-tech-radar` | `./dynamic-plugins/dist/plugin-tech-radar` | `oci://ghcr.io/.../plugin-tech-radar:pr_1845__1.13.0!alias` | Yes |
| 3 | Workspace plugin (wrapper, stale OCI in config) | `./dynamic-plugins/dist/plugin-github-org-dynamic` | `oci://ghcr.io/.../plugin-github-org:bs_1.45.3__0.3.16` | `oci://ghcr.io/.../plugin-github-org:pr_1845__0.3.20!alias` | Yes |
| 4 | Workspace plugin (OCI, wrapper in config) | `oci://ghcr.io/.../plugin-tekton:bs_1.49.4__3.33.3!alias` | `./dynamic-plugins/dist/plugin-tekton` | `oci://ghcr.io/.../plugin-tekton:pr_1845__3.33.3!alias` | Yes |
| 5 | Cross-workspace (local path, no metadata) | — | `./dynamic-plugins/dist/plugin-kubernetes-backend-dynamic` | unchanged | No (no metadata) |
| 6 | Cross-workspace (OCI, no metadata) | — | `oci://ghcr.io/.../plugin-dynamic-home-page:bs_1.45.3__1.10.3!alias` | unchanged | No |
| 7 | npm package (no metadata) | — | `@rhdh/plugin-global-header-test@0.0.2` | unchanged | No |
| 8 | Different registry (quay.io) | `oci://quay.io/rhdh/plugin-events@sha256:abc` | `oci://ghcr.io/.../plugin-events:old_tag` | `oci://ghcr.io/.../plugin-events:pr_1845__0.4.6!alias` | Yes |
| 9 | Different registry (registry.access.redhat.com) | `oci://registry.access.redhat.com/rhdh/plugin-orch@sha256:f40d` | `oci://ghcr.io/.../plugin-orch:some_tag` | `oci://ghcr.io/.../plugin-orch:pr_1845__1.0.0!alias` | Yes |

### Nightly Mode (`E2E_NIGHTLY_MODE=true`, no `GIT_PR_NUMBER`)

| # | Scenario | Metadata `dynamicArtifact` | User config `package` | Resolved `package` | Config injection |
|---|----------|---------------------------|----------------------|---------------------|-----------------|
| 1 | Workspace plugin (OCI) | `oci://ghcr.io/.../plugin-tekton:bs_1.49.4__3.33.3!alias` | `oci://ghcr.io/.../plugin-tekton:old_tag!alias` | `oci://ghcr.io/.../plugin-tekton:bs_1.49.4__3.33.3!alias` (from metadata) | **Skipped** |
| 2 | Workspace plugin (wrapper) | `./dynamic-plugins/dist/plugin-tech-radar` | `./dynamic-plugins/dist/plugin-tech-radar` | `./dynamic-plugins/dist/plugin-tech-radar` (from metadata) | **Skipped** |
| 3 | Workspace plugin (wrapper, stale OCI in config) | `./dynamic-plugins/dist/plugin-github-org-dynamic` | `oci://ghcr.io/.../plugin-github-org:bs_1.45.3__0.3.16` | `./dynamic-plugins/dist/plugin-github-org-dynamic` (from metadata) | **Skipped** |
| 4 | Workspace plugin (OCI, wrapper in config) | `oci://ghcr.io/.../plugin-tekton:bs_1.49.4__3.33.3!alias` | `./dynamic-plugins/dist/plugin-tekton` | `oci://ghcr.io/.../plugin-tekton:bs_1.49.4__3.33.3!alias` (from metadata) | **Skipped** |
| 5 | Cross-workspace (local path, no metadata) | — | `./dynamic-plugins/dist/plugin-kubernetes-backend-dynamic` | unchanged | **Skipped** |
| 6 | Cross-workspace (OCI, no metadata) | — | `oci://ghcr.io/.../plugin-dynamic-home-page:bs_1.45.3__1.10.3!alias` | unchanged | **Skipped** |
| 7 | npm package (no metadata) | — | `@rhdh/plugin-global-header-test@0.0.2` | unchanged | **Skipped** |
| 8 | Different registry (quay.io) | `oci://quay.io/rhdh/plugin-events@sha256:abc` | `oci://ghcr.io/.../plugin-events:old_tag` | `oci://quay.io/rhdh/plugin-events@sha256:abc` (from metadata, different registry) | **Skipped** |
| 9 | Different registry (registry.access.redhat.com) | `oci://registry.access.redhat.com/rhdh/plugin-orch@sha256:f40d` | `oci://ghcr.io/.../plugin-orch:some_tag` | `oci://registry.access.redhat.com/rhdh/plugin-orch@sha256:f40d` (from metadata) | **Skipped** |

### Key Takeaways

| Rule | Explanation |
|------|-------------|
| **Metadata always wins** | When metadata exists, `spec.dynamicArtifact` determines the package — the user config's `package` field is overwritten |
| **No metadata = passthrough** | Cross-workspace plugins, npm packages, and anything without a metadata match passes through unchanged |
| **PR mode overrides everything** | Even if metadata says wrapper, PR mode builds an OCI URL from `source.json` + `plugins-list.yaml` |
| **Nightly skips config injection** | User `pluginConfig` is preserved as-is; metadata `appConfigExamples` is NOT merged in |
| **Registry comes from metadata** | In nightly/local, the exact registry from metadata is used (quay.io, registry.access.redhat.com, etc.). In PR mode, all PR images come from `ghcr.io` |
| **Row 3 is a common pitfall** | If your config has a stale OCI ref but metadata says wrapper, the resolver uses the wrapper path from metadata. Keep your `dynamic-plugins.yaml` in sync, or better yet, don't create one — let it auto-generate from metadata |

### Cross-Workspace Plugins

The resolver only looks at `metadata/` in the **current workspace**. It does not search other workspaces. If your test needs a plugin from another workspace (rows 5-6 above), there's no metadata match, so the package reference passes through unchanged in all modes.

When using an OCI ref for a cross-workspace plugin, you often need to also **disable the local wrapper** for that plugin (included in `dynamic-plugins.default.yaml`), otherwise both versions load and conflict:

```yaml
plugins:
  # Cross-workspace OCI — passes through as-is
  - package: oci://ghcr.io/.../plugin-dynamic-home-page:bs_1.45.3__1.10.3!alias
    disabled: false

  # Disable the local wrapper to avoid conflicts
  - package: ./dynamic-plugins/dist/plugin-dynamic-home-page
    disabled: true
```

## Auto-Generation (No dynamic-plugins.yaml)

When `tests/config/dynamic-plugins.yaml` doesn't exist, the framework generates the full plugin list from `metadata/*.yaml`:

1. Reads every `*.yaml` in `metadata/`
2. Creates an entry per plugin: `{ package: spec.dynamicArtifact, disabled: false }`
3. Runs the same resolution steps above

This is the recommended approach — most workspaces don't need a `dynamic-plugins.yaml`.

## Common Pitfalls

### Config injection is skipped in nightly

In nightly mode, `appConfigExamples` from metadata are NOT injected. If your test relies on config from metadata, you must provide it explicitly in `app-config-rhdh.yaml` or inline in `pluginConfig`.

### PR mode requires /publish first

PR mode constructs OCI URLs like `pr_1845__3.33.3` but doesn't verify the image exists. You must comment `/publish` on the PR before running tests, otherwise RHDH will fail to pull the image.
