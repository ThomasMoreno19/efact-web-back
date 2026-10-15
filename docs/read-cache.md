# File-backed read cache

- Read results are stored as JSON files under `READ_CACHE_DIR`; when unset, the backend uses `.efact-read-cache` under its current working directory.
- The cache directory must be writable and private, outside the public web root. Cache files and directories are created with owner-only permissions.
- On deployments where the application directory is replaced on release, set `READ_CACHE_DIR` to a persistent path outside that directory to retain cache files across deployments.
- The cache is rebuildable and expires entries after 30 minutes. Successful API updates and completed Excel imports invalidate affected company/table groups.
- Company configuration, clients, equipment, movements, schedules, and each catalog table use separate cache groups scoped to the company. Company list and slug lookups use small shared indexes.
- Backend processes share cache entries and invalidations only when they use the same persistent directory. The cache is derived data, not a database backup.
