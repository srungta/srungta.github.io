---
layout: post
unique_id: STARTRIGHT-01

title: What/Why/How of 'nonce'
subtitle: Securing websites from attacks using nonce tokens
tldr: Using nonce tokens in your website gives a strong protection against CSRF and XSS attacks.
permalink: /blog/start-right/ui-nonce
author: srungta
tags:
  - Start Right
  - Frontend
  - Nonce
  - Security

series:
  id: STARTRIGHT
  index: 1
---

# What is a Nonce? A Simple Explanation

At its core, a "nonce" is simply a "number used once". This implies its primary purpose of introducing uniqueness into a system or communication to prevent certain types of attacks. The key characteristics of a nonce is its uniqueness, its often random or pseudo-random generation, and its intended one-time use within a specific context.

> In some implementations, a nonce might also include a timestamp to further restrict its validity to a specific time frame.

Think of nonce as a single-use ticket for an event. Each ticket has a unique number and is valid for only one entry. Once used, the same ticket cannot grant access again. Similarly, a nonce acts as a unique identifier for a specific action or communication, preventing its reuse. Any subsequent attempt to use the same ticket would be recognized as illegitimate.

> While this post is about web security, nonces have a broader range of applications. They are fundamental in various cryptographic protocols to ensure the freshness and integrity of communications. Nonces are also employed in authentication processes to prevent replay attacks, in blockchain technology, such as in the mining process of cryptocurrencies like Bitcoin , and as initialization vectors in encryption algorithms to ensure that the same plaintext encrypted multiple times with the same key produces different ciphertexts. This widespread use underscores the fundamental role of nonces in maintaining security and data integrity across diverse technological domains.

# The Unsung Hero of Web Security: Why Nonces Matter

Nonce plays a fundamental role in safeguarding web applications from prevalent vulnerabilities like Cross-Site Request Forgery (CSRF) and Cross-Site Scripting (XSS).

## Protection against CSRF Attacks

### How CSRF Attacks Work?

Cross-Site Request Forgery (CSRF) is a type of attack that manipulates a logged-in user's browser to perform unintended actions on a web application in which they are currently authenticated. This attack leverages the way web browsers automatically send session cookies (or other authentication credentials) with every request made to a website the user is logged into. The targeted web application, relying on the presence of these credentials, often cannot differentiate between a legitimate action initiated by the user and a forged request initiated by an attacker.

CSRF attacks can cause significant damange. Attackers can potentially force you to change account settings, such as email addresses or passwords , make unauthorized fund transfers or purchases , submit data on your behalf (like posting unwanted content or altering preferences). In you are an admin, a CSRF attack can even lead to the complete compromise of the systems you manage.

Attackers craft a malicious link or embeds a hidden form on a website or within an email. If you are logged into the vulnerable web application and click this link or visit the attacker's page, your browser will automatically send a request to the target website, complete with the your session cookies. From the server's perspective, this request appears to be a legitimate action performed by you, the authenticated user. The vulnerability lies in the web application's reliance solely on the session cookie for authentication without further verification of the request's origin or intent.

### How Nonces Prevent CSRF

Nonces are often referred to as anti-CSRF tokens in the context of preventing Cross-Site Request Forgery. The core idea is to have a secret, unpredictable, generated value that an attacker cannot easily obtain or reproduce.

It usually goes like this:

1. When you successfully log into a website, the server generates a unique, unpredictable nonce value specifically for your current session. This nonce is essentially a secret that only the server and your current session are aware of.
2. This generated nonce is transmitted to your browser. A common practice is to embed it as a hidden field within any HTML form that performs a state-changing action.
   > Alternatively, although less common due to potential XSS risks, it can sometimes be stored in a session cookie.
3. For any subsequent request that could modify the application's state (such as submitting a form to update data or initiate a transaction), the application mandates that this nonce be included as a parameter in the request, typically as part of the form data or sometimes as a URL parameter. The server first checks for the presence of the nonce and then validates its authenticity. This validation involves comparing the received nonce with the one that was originally generated and stored for your session on the server. If the nonces do not match, or if the nonce is missing altogether, the server recognizes this as a potential CSRF attack and consequently rejects the request, thereby preventing the unauthorized action from being executed.

For example, Consider a simple HTML form used to update a user's profile.  
Without CSRF protection, an attacker could create a form on their own website that, when submitted, would send a request to the profile update endpoint of the vulnerable application, potentially changing your information if you happened to be logged in. However, by implementing nonce protection, the legitimate profile update form would include a hidden input field containing the unique, session-specific nonce. When you submit this form, the server verifies the nonce. An attacker, operating from a different domain, would not be able to access or guess this nonce value, and therefore any forged request they create would lack the correct nonce, causing the server to reject it.

> For an even stronger layer of defense, some applications employ per-request nonces, where a new nonce is generated for each sensitive action, rather than relying on a single nonce for the entire session. While nonces and CSRF tokens are often used interchangeably in the context of preventing CSRF, it's important to note that a CSRF token is specifically designed for this purpose, whereas a general nonce can have broader applications beyond just preventing cross-site request forgery.

## Protection against XSS Attacks

### How XSS Attacks Work?

Cross-Site Scripting (XSS) is a vulnerability that enables attackers to inject malicious scripts, most commonly JavaScript, into web pages viewed by other users. These attacks exploit the fundamental principle that web applications often include dynamic content based on user input. If this input is not properly validated or sanitized before being displayed, an attacker can inject malicious code that will then be executed by the victim's browser as if it were a legitimate part of the website.

There are primarily three types of XSS attacks.

| XSS Attack        | Description                                                                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reflected XSS** | occurs when the malicious script is injected through the URL or other request parameters and is immediately reflected back to the user in the response. This often involves tricking the user into clicking a specially crafted link.                                                       |
| **Stored XSS**    | considered the most dangerous type, happens when the malicious script is injected into the application's database, for example, through a comment field or user profile, and is later retrieved and executed when other users view the affected content.                                    |
| **DOM-based XSS** | arises when the vulnerability lies in the client-side JavaScript code itself, where it improperly processes data from an attacker-controlled source, such as the URL, and passes it to a dangerous function that manipulates the Document Object Model (DOM) without adequate sanitization. |

XSS attacks can be severe. Attackers can steal your session cookies, allowing them to hijack your sessions and impersonate you. They can also hijack login credentials by capturing keystrokes or redirecting you to to a fake login page , access or modify your sensitive data , deface the website or display misleading content , or even redirect you to malicious websites.

### How Nonces (with CSP) Prevent XSS

> BEWARE : nonce is not a replacement for proper input validation and output encoding. You **MUST MUST** do them always.

Nonces, when used in conjunction with Content Security Policy (CSP), provide a powerful layer of protection, particularly against attacks involving the injection of inline scripts and styles.

> Content Security Policy (CSP) is a security feature that allows web developers to control the resources (such as scripts, styles, images, etc.) that the browser is allowed to load and execute for a given web page. You can specify things like `script-src mysite.com` and the browser would not run anything that isnt allowed explicitly on your site. Super powerful security feature.

First the server generates a unique, cryptographically strong random nonce value for each HTTP response, meaning every time a page is loaded. This nonce is then included in the Content-Security-Policy HTTP header sent by the server to the browser. Within this header, the script-src directive is configured to specify that only scripts possessing a nonce attribute with a value that matches the one provided in the header are permitted to execute (e.g., script-src 'nonce-{RANDOM}' ).

Simultaneously, the same unique nonce value is added as a nonce attribute to all legitimate inline `<script>` tags and `<style>` tags within the HTML of the page. When the browser receives the HTML and the CSP header, it enforces the policy. It will only execute inline scripts and apply inline styles that have the correct nonce attribute, effectively creating a list of trusted inline code.

Any malicious script injected into the page by an attacker, whether through a reflected, stored, or DOM-based XSS vulnerability, will not possess the correct, dynamically generated nonce value. As a result, the browser will not find a matching nonce in the CSP policy for the injected script and will block its execution, thus preventing the XSS attack. It is crucial that the nonce value is unique for every single page load and generated using a cryptographically secure random source to prevent attackers from guessing or reusing it.

> In some scenarios, the strict-dynamic CSP directive can be used in conjunction with nonces. This directive allows scripts that are trusted by virtue of having a correct nonce to dynamically load additional JavaScript resources, simplifying the management of CSP in applications that rely on dynamic script loading. While both nonces and hashes can be used with CSP to allow inline scripts, nonces offer more flexibility for dynamically generated content, as the hash of a script would need to be recalculated every time the script's content changes.

# Implementing Nonces: Practical Examples

Implementing nonces effectively requires generating cryptographically secure random values and integrating them into your application's request handling and response generation.
Here are examples in PHP, Python, and JavaScript.

## Nonce Implementation in PHP

PHP

{%- highlight php -%}

<?php
// Function to generate a cryptographically secure nonce
function generateNonce(): string {
    return bin2hex(random_bytes(32)); // Generates a 64-character hex string (256 bits)
}

// CSRF Protection Example
session_start();
if ($_SERVER === 'POST') {
    if (!isset($_POST['csrf_nonce']) ||!isset($_SESSION['csrf_nonce']) |
| $_POST['csrf_nonce']!== $_SESSION['csrf_nonce']) {
        die("CSRF token invalid");
    }
    unset($_SESSION['csrf_nonce']); // Consume the nonce
    // Process the form data
}

$csrfNonce = generateNonce();
$_SESSION['csrf_nonce'] = $csrfNonce;
?>

{%- endhighlight -%}

{%- highlight html -%}

<form method="POST" action="/submit">
    <input type="hidden" name="csrf_nonce" value="<?php echo htmlspecialchars($csrfNonce, ENT_QUOTES, 'UTF-8');?>">
    <button type="submit">Submit</button>
</form>
{%- endhighlight -%}

{%- highlight php -%}

<?php
// XSS Prevention (with CSP) Example
$cspNonce = generateNonce();
header("Content-Security-Policy: script-src 'nonce-$cspNonce'");
?>

{%- endhighlight -%}

{%- highlight php -%}

<script nonce="<?php echo htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8');?>">
    // Your inline JavaScript code here
</script>

{%- endhighlight -%}

WordPress provides built-in functions like [wp_nonce_field()](https://developer.wordpress.org/reference/functions/wp_nonce_field/), [wp_verify_nonce()](https://developer.wordpress.org/reference/functions/wp_nonce_field/), [wp_create_nonce()](https://developer.wordpress.org/reference/functions/wp_create_nonce/), and [wp_nonce_url()](https://developer.wordpress.org/reference/functions/wp_nonce_url/) to simplify CSRF protection.

## Nonce Implementation in Python

{%- highlight python -%}
import secrets
import html
from flask import Flask, session, request, render_template

app = Flask(**name**)
app.secret_key = 'your_secret_key' # Replace with a strong secret key

def generate_nonce():
return secrets.token_urlsafe(32) # Generates a 43-character URL-safe string (256 bits)

@app.route('/form')
def form_page():
nonce = generate_nonce()
session['csrf_nonce'] = nonce
return render_template('form.html', csrf_nonce=html.escape(nonce))

@app.route('/submit', methods=)
def submit_form():
if 'csrf_nonce' not in session or 'csrf_nonce' not in request.form or request.form['csrf_nonce']!= session['csrf_nonce']:
return 'CSRF attack detected!', 400
session.pop('csrf_nonce', None) # Process the form data
return 'Form submitted successfully!'

@app.route('/protected_page')
def protected_page():
csp_nonce = generate_nonce()
response = render_template('protected_page.html', csp_nonce=html.escape(csp_nonce))
response.headers = f"script-src 'nonce-{csp_nonce}'"
return response
{%- endhighlight -%}

{%- highlight html -%}

<form method="POST" action="/submit">
    <input type="hidden" name="csrf_nonce" value="{{ csrf_nonce }}">
    <button type="submit">Submit</button>
</form>

<script nonce="{{ csp_nonce }}">
    // Your inline JavaScript code here
</script>

{%- endhighlight -%}

# The Danger of Neglect: Real-World Examples when Nonce Protection Was Missing

The absence or improper implementation of nonce protection has been a contributing factor in numerous real-world website exploits.

1. uTorrent Exploit (2008): This widely reported incident demonstrated the severe consequences of lacking CSRF protection. Attackers exploited a vulnerability in the uTorrent web interface to force users to download and execute malware simply by visiting a malicious webpage or opening a specially crafted email. Reference: https://nvd.nist.gov/vuln/detail/CVE-2008-6586

2. British Airways (2018): This high-profile attack involved the injection of malicious JavaScript code into the British Airways website, resulting in the theft of credit card details from hundreds of thousands of customers. While not solely due to the lack of nonces, the absence of a strict CSP utilizing nonces or hashes likely contributed to the success of the attack by allowing the execution of unauthorized inline scripts.  Reference : https://akimbocore.com/article/british-airways-breach-2018/

3. eBay (2015-2016): Attackers exploited an XSS vulnerability on eBay to gain access to seller accounts, manipulate listings, and potentially steal payment information. This incident underscores the importance of properly sanitizing user-provided content and implementing CSP to restrict script execution.  Reference :https://www.netcraft.com/blog/hackers-still-exploiting-ebays-stored-xss-vulnerabilities-in-2017/

4. Fortnite (2018): An XSS vulnerability on the popular Fortnite website could have allowed attackers to compromise user accounts. Refereence : https://portswigger.net/daily-swig/xss-slip-up-exposed-fortnite-gamers-to-account-hijack

# Summary and best Practices for secure Nonce generation and handling

As CSRF token, nonces disallow unexpected api requests to execute hence protecting your users.
When used with CSP, nonces allow only trusted inline scripts and styles to execute, making it considerably more difficult for attackers to inject and run malicious code and reducing the need for the less secure `unsafe-inline` directive. More broadly, nonces help prevent replay attacks by ensuring the uniqueness of requests, add originality to communications, and are a versatile security tool applicable in various contexts beyond just CSRF and XSS.
To maximize the security benefits of nonces, it is crucial to adhere to best practices for their generation and handling.

- For generation, always use a cryptographically secure random number generator (CSPRNG) to ensure unpredictability and sufficient entropy.
- Ensure the nonce has sufficient length, ideally at least 128 bits for CSP
- Generate unique nonces for each user session (for CSRF) or each page load (for CSP).
- Consider including a timestamp with caution, as it requires accurate time synchronization.
- For handling, transmit nonces securely over HTTPS.
- Store CSRF nonces securely on the server-side and compare them with submitted nonces.
- For CSP, ensure the nonce in the header matches the attribute in HTML tags.
- Always validate nonces on the server-side , and for CSRF, consume nonces after use.
- Regenerate nonces on significant security events.
- Generally, avoid exposing CSRF nonces in URLs and handle them carefully in AJAX requests.
- Most importantly, **never reuse nonces.**
