# Security Policy

QuickVoice handles telephony workflows, customer data, credentials, and runtime agent configuration. Please report security issues privately.

## Reporting A Vulnerability

Use GitHub private vulnerability reporting for this repository if it is available.

If private reporting is unavailable, contact:

```text
security@quickvoice.co
```

Please include:

- A clear description of the issue.
- Affected components or paths.
- Steps to reproduce.
- Potential impact.
- Any suggested mitigation.

Do not open a public issue for an unpatched vulnerability.

## Scope

Security reports are most useful when they involve:

- Authentication or authorization bypasses.
- Exposure of API keys, tokens, call data, recordings, transcripts, or customer data.
- Server-side request forgery, injection, or remote code execution.
- Unsafe handling of uploads, webhooks, telephony callbacks, or runtime agent configuration.
- Vulnerabilities in deployment defaults or local development scripts that could leak secrets.

## Response

We aim to acknowledge valid reports promptly, investigate impact, and coordinate a fix before public disclosure. Timelines depend on severity and the complexity of the affected component.
