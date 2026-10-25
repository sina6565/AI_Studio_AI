# Security Policy — SINA AI STUDIO

## Reporting a vulnerability
Do not publish exploitable details, credentials, personal data, or a proof of concept in a public issue.
Report suspected vulnerabilities privately to the repository owner through GitHub's private vulnerability reporting feature, if enabled, or through a separately verified private contact channel.

Include the affected component, impact, reproduction steps, and any suggested mitigation. Do not include live API keys, passwords, database connection strings, or access tokens.

## Secret handling
- Never commit real values for `AGNES_API_KEY`, `JWT_SECRET`, `MONGODB_URI`, `REDIS_URL`, cloud credentials, or deployment tokens.
- Store production values in the deployment platform's secret/environment settings.
- Treat any credential that appeared in a commit, log, build artifact, or public issue as exposed: revoke or rotate it first, then clean up history where appropriate.
- Example environment files must contain placeholders only.

## Supported scope
This policy covers the SINA AI STUDIO repository and its first-party application code. Third-party packages and services remain subject to their own security policies and licenses.
