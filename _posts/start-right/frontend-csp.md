---
layout: post
unique_id: STARTRIGHT-02

title: CSP - Block everything you dont need
subtitle: Securing websites from attacks using CSP headers
tldr: Using CSP headers can drastically reduce the attack surface for your website by disallowing anything you dont expect.
permalink: /blog/start-right/ui-csp
author: srungta
tags:
  - Start Right
  - Frontend
  - CSP
  - Security

series:
  id: STARTRIGHT
  index: 2
---
### Understanding Content Security Policy (CSP)

Content Security Policy (CSP) is essentially a header that your server sends to the frontend. The header value tells the browser what exactly it should allow to run. Anything that violates the CSP policy is blocked implicitly by the browser. It is a very simple and super powerful 
is allowed a powerful security feature that helps protect websites from various types of attacks, such as Cross-Site Scripting (XSS) and data injection attacks. By defining a strict set of rules for what resources a browser is allowed to load and execute, CSP significantly reduces the attack surface of your web application.


### Why CSP Matters

Modern web applications often rely on dynamic content and third-party integrations, which can inadvertently introduce vulnerabilities. CSP acts as a safeguard by allowing developers to specify which sources of content are trusted. This ensures that only approved scripts, styles, images, and other resources are executed, blocking malicious content injected by attackers.

### Key Features of CSP

1. **Script and Style Control**: CSP allows you to restrict the execution of inline scripts and styles unless they are explicitly trusted using mechanisms like nonces or hashes.
2. **Domain Whitelisting**: You can specify trusted domains for loading resources such as images, fonts, and scripts.
3. **Mitigation of XSS Attacks**: By disallowing inline scripts and restricting external scripts to trusted sources, CSP helps prevent the execution of malicious code.
4. **Reporting Violations**: CSP can be configured to report violations to a specified endpoint, enabling you to monitor and address potential security issues.

### How CSP Works

CSP is implemented using the `Content-Security-Policy` HTTP header or a `<meta>` tag in your HTML. The policy defines directives that specify the allowed sources for different types of content. For example:

```http
Content-Security-Policy: script-src 'self' https://trusted.cdn.com; style-src 'self';
```

This policy allows scripts to be loaded only from the same origin (`'self'`) or a trusted CDN, and styles only from the same origin.

### Using Nonces with CSP

Nonces are unique, cryptographically secure tokens generated for each HTTP response. They are used to mark inline scripts and styles as trusted. Here's how it works:

1. The server generates a unique nonce for each page load.
2. The nonce is included in the `Content-Security-Policy` header:
  ```http
  Content-Security-Policy: script-src 'nonce-abc123';
  ```
3. Inline scripts include the nonce as an attribute:
  ```html
  <script nonce="abc123">
     console.log('This script is trusted.');
  </script>
  ```
4. The browser executes only scripts with the correct nonce.

### Best Practices for Implementing CSP

- **Start with a Report-Only Mode**: Use the `Content-Security-Policy-Report-Only` header to test your policy without blocking content.
- **Use Nonces or Hashes**: Avoid the `unsafe-inline` directive, and use nonces or hashes to allow trusted inline scripts and styles.
- **Whitelist Trusted Domains**: Be specific about the domains you trust for loading resources.
- **Monitor Violations**: Set up a reporting endpoint to collect CSP violation reports and refine your policy.
- **Iterate Gradually**: Start with a basic policy and progressively tighten it as you identify and address issues.

### Example CSP Header

Here’s an example of a robust CSP header:

```http
Content-Security-Policy: 
   default-src 'self'; 
   script-src 'self' 'nonce-abc123' https://trusted.cdn.com; 
   style-src 'self' 'nonce-abc123'; 
   img-src 'self' https://images.example.com; 
   connect-src 'self' https://api.example.com; 
   report-uri /csp-violation-report-endpoint;
```

### Conclusion

Content Security Policy is a critical tool for securing modern web applications. By carefully defining and enforcing a CSP, you can protect your users and your application from a wide range of attacks. Start small, monitor violations, and refine your policy to achieve a balance between security and functionality.

Implement CSP today to take a proactive step toward a more secure web experience.
