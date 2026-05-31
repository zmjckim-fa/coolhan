# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.3.x (current) | ✅ |
| 0.2.x | ⚠️ Limited |
| < 0.2 | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability in CoolHan:

1. **Do NOT open a public GitHub Issue**
2. Create a [Security Advisory](https://github.com/zmjckim-fa/coolhan/security/advisories/new)
3. Or email the maintainer directly

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix/Patch:** Within 30 days for critical, 90 days for non-critical

## Security Design Principles

### CoolHan Framework

1. **No credential storage** — CoolHan never stores API keys or passwords
2. **No network access** — Framework runs locally within Claude Code
3. **Read-only knowledge base** — Spec documents are read-only during development
4. **Audit trail** — All decisions recorded in `_workspace/` directory

### Voynich Research Tool

1. **Local database only** — SQLite, no network database connections
2. **No external API calls** — All analysis is offline
3. **Evidence tier separation** — External claims cannot pollute primary evidence tables
4. **Translation claim guardrail** — Automatically isolated from fact tables

## Known Limitations

- CoolHan hooks run as Node.js scripts with user permissions
- The `devops-deployer` agent can execute shell commands — review before use in production
- `install.sh` / `install.ps1` require elevated permissions for system-wide installation

## Audit

The codebase is audited by:
- GitHub Actions CI on every push
- Static security checks in `.github/workflows/test.yml`
- Manual review for all PRs touching `.claude/` or `knowledge_base/`
