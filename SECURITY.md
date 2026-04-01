<!-- SpecDriven:managed:start -->
# Security Policy

## Security Constraints and Practices

- **Access Guarding:** All authenticated routes MUST be protected using the `logged-user` or `profile-permission` guards. Do not expose routes without proper role validation.
- **Handling Sensitive Data:** Do not store sensitive tokens directly in unencrypted `localStorage` unless explicitly architected that way. Avoid console logging raw response payloads containing personal or sensitive context.
- **Cross-Site Scripting (XSS):** Rely on Angular's default HTML sanitization. Avoid bypassing it via `bypassSecurityTrustHtml` unless absolutely necessary and heavily vetted.

## Reporting Process

If you discover a security vulnerability, do NOT open a public issue. Instead, please follow the designated private disclosure process for the project (e.g., emailing the maintainer or using GitHub's private vulnerability reporting feature if enabled).
<!-- SpecDriven:managed:end -->
