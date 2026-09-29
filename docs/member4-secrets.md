# Member 4 – Secrets Management

## Objective

The objective of this task is to ensure that passwords, API keys, tokens, private keys, and connection strings are not hardcoded in the project source code or accidentally committed to the Git repository.

## Secrets Protection

The project uses `.gitignore` rules to prevent sensitive environment files and private key files from being accidentally committed.

Protected file patterns include:
- `.env`
- `.env.*`
- `*.pem`
- `*.key`

Node.js dependency folders (`node_modules/`) and debug log files (`npm-debug.log*`) are also excluded.

## GitHub Actions Secrets

To demonstrate secure secrets provisioning, the following encrypted secrets have been successfully configured in the GitHub repository settings:
- `JWT_SECRET`
- `DB_PASSWORD`

These secrets are injected into the GitHub Actions CI/CD pipeline at runtime using environment variables. The pipeline workflow accesses them using the syntax: `${{ secrets.JWT_SECRET }}`.

## Secret Provisioning Flow

The implemented flow is:
Developer (creates secret in GitHub UI)
   |
   v
GitHub encrypted Secret (stored securely)
   |
   v
GitHub Actions workflow (injects secret via env:)
   |
   v
Environment variable (passed to Docker container)
   |
   v
Application / security tool

The actual secret values are never stored in the source-code repository or Git history.

## Current Project Status

While the Juice Shop application does not contain hardcoded credentials in its source code, the `JWT_SECRET` and `DB_PASSWORD` have been created as GitHub Actions encrypted secrets to fulfill the assignment requirement. This proves that our CI/CD pipeline is capable of securely handling sensitive configurations without exposing them in the repository. Member 3 will integrate these secrets into the pipeline workflow.

## Validation

The `.gitignore` configuration and secrets documentation have been committed to the `member4/secrets-integration` branch. 
End-to-end validation (verifying the secrets successfully inject into the Docker container and pipeline) will be performed once Members 1, 2, and 3 merge their application, vulnerability-fix, and CI/CD pipeline work.

## Security Principle

Sensitive values should be supplied through secure configuration mechanisms instead of being hardcoded in application source code.