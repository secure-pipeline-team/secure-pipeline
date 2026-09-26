# Member 4 – Secrets Management

## Objective

The objective of this task is to ensure that passwords, API keys,
tokens, private keys, and connection strings are not hardcoded in
the project source code or accidentally committed to the Git repository.

## Secrets Protection

The project uses `.gitignore` rules to prevent sensitive environment
files and private key files from being accidentally committed.

Protected file patterns include:

- `.env`
- `.env.*`
- `*.pem`
- `*.key`

Node.js dependency folders and debug log files are also excluded.

## GitHub Actions Secrets

If the application or CI/CD pipeline requires a sensitive value,
the value will be stored using GitHub Actions encrypted Secrets
rather than being written directly into source code.

The secret can then be provided to the GitHub Actions workflow
through the workflow environment.

## Secret Provisioning

The intended flow is:

Developer
   |
   v
GitHub encrypted Secret
   |
   v
GitHub Actions workflow
   |
   v
Environment variable
   |
   v
Application / security tool

The actual secret value is not stored in the source-code repository.

## Current Project Status

The current project configuration does not contain a required
application password, API key, or connection string that needs to
be placed into GitHub Secrets.

Therefore, no artificial secret has been created solely for the
assignment.

The repository is prepared to securely handle secrets if a later
pipeline or application component requires one.

## Validation

The `.gitignore` configuration has been committed to the
Member 4 branch.

Further end-to-end validation will be performed after Members 1,
2, and 3 merge their application, vulnerability-fix, and CI/CD
work.

## Security Principle

Sensitive values should be supplied through secure configuration
mechanisms instead of being hardcoded in application source code.