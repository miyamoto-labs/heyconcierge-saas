# TrustClaw’s Security Model

TrustClaw ensures that every AI agent skill is safe to run. Here’s what we check and how we protect users:

## Verification Process
1. **Static Analysis**: Scans for malicious code, vulnerabilities, and compliance with best practices.
2. **Dynamic Analysis**: Monitors runtime behavior for unexpected actions (e.g., data exfiltration).
3. **Sandboxing**: Skills run in isolated environments to prevent system-wide impacts.

## Protections
- **Data Privacy**: Skills cannot access sensitive user data without explicit consent.
- **Rate Limiting**: Prevents abuse of external APIs.
- **Automatic Updates**: Ensures skills are patched against newly discovered vulnerabilities.

## Continuous Monitoring
TrustClaw re-evaluates skills periodically and responds to user reports to maintain a secure ecosystem.

Learn more in our [Security Overview](https://trustclaw.ai/security).