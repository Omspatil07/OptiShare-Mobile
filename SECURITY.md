# Security Policy

## Reporting a Vulnerability

OptiShare takes security seriously, especially given our focus on air-gapped and security-sensitive environments.

If you discover a security vulnerability, please **DO NOT** create a public GitHub issue. Instead, report it directly to our maintainers via email at:

📧 **omspatil07@gmail.com**

Please include:
- A description of the vulnerability and its potential impact.
- Detailed step-by-step instructions or proof-of-concept code to reproduce the issue.
- Affected platform(s) and app version.

### Response Timeline

- **Acknowledgement**: Within 48 hours.
- **Assessment & Fix**: Within 14 days for critical vulnerabilities.
- **Public Disclosure**: Coordinated after a patch is released to all supported distribution channels.

---

## Security Architecture Guarantees

1. **No Network Access**: OptiShare never requests `INTERNET` permission on Android and contains zero networking code.
2. **Ephemeral Keys**: AES-256-GCM encryption keys are generated per session and held only in native memory (never written to disk or logs).
3. **Data Integrity**: SHA-256 checksums verify full-file integrity post-transfer.
