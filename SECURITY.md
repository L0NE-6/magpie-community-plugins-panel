# Security Policy

## Reporting

Report vulnerabilities privately through this repository's GitHub Security
Advisories. If the issue also affects the upstream project, submit the same
redacted report to `magpie-community/plugins` through its Security Advisories.

Do not open a public issue containing credentials, account identifiers,
private prompts, unredacted HAR files or exploitable request details.

## Scope

This maintenance fork can patch and test upstream code, but it cannot publish
an upstream fix. Upstream maintainers retain control of upstream releases,
npm packages and the `dist` branch.

## Supported Code

Security fixes are developed against the latest `panel` branch, which tracks
`upstream/main`. A tested fix is offered upstream before it is kept as a local
maintenance patch.
