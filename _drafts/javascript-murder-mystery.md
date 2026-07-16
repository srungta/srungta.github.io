---
layout: post
unique_id: WEB10

title: I Turned Off JavaScript and the Internet Died
subtitle: A murder mystery investigating what breaks without JS
tldr: Disable JavaScript and discover which sites still work, which break gracefully, and which crash spectacularly. Progressive enhancement, server-side rendering, and the great debate over whether websites should work without JavaScript.
# permalink: /blog/web/javascript-murder-mystery
author: srungta
tags:
  - Web
  - JavaScript
  - Progressive Enhancement
  - Performance

series:
  id: WEB
  index: 9
---


## The Crime Scene

**Date:** March 3, 2026  
**Location:** Your browser  
**Victim:** The Internet  
**Cause of death:** `<script>` tag disabled  
**Suspects:** Developers who forgot websites existed before JavaScript

**Detective:** (examining the crime scene) What happened here?

**Witness:** I... I just wanted to reduce tracking. I turned off JavaScript. And then... everything stopped working.

**Detective:** Tell me exactly what you saw.

## Exhibit A: The Victims

### Dead on Arrival (Complete Failure)

**1. Single Page Apps (SPAs)**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

**With JavaScript:** Beautiful, interactive app  
**Without JavaScript:** A blank page with absolutely nothing

**Why it died:** 
- Entire app rendered by JavaScript
- HTML is just a mount point
- No fallback content

**Survivors:** 0%

**2. Form Validations**

```html
<form onsubmit="return validateForm()">
  <input id="email" type="text">
  <button type="submit">Submit</button>
</form>

<script>
function validateForm() {
  const email = document.getElementById('email').value;
  if (!email.includes('@')) {
    alert('Invalid email');
    return false;
  }
  return true;
}
</script>
```

**With JavaScript:** Validates email, shows error  
**Without JavaScript:** Submits invalid data to server

**Why it died:** Client-side validation with no server-side backup

**3. Infinite Scroll**

```html
<div id="feed">
  <!-- First 10 items -->
</div>

<script>
window.addEventListener('scroll', () => {
  if (nearBottom()) {
    loadMoreItems();
  }
});
</script>
```

**With JavaScript:** Loads more items as you scroll  
**Without JavaScript:** Only see first 10 items, no way to load more

**Why it died:** No pagination fallback

### Critically Injured (Severe Degradation)

**1. Navigation Menus**

```html
<button onclick="toggleMenu()">☰ Menu</button>
<nav id="menu" style="display:none">
  <a href="/home">Home</a>
  <a href="/about">About</a>
</nav>
```

**With JavaScript:** Click to toggle menu  
**Without JavaScript:** Menu never appears, links are hidden forever

**Why it failed:** CSS `display:none` with no CSS-only fallback

**Better approach:**

```html
<input type="checkbox" id="menu-toggle" class="visually-hidden">
<label for="menu-toggle">☰ Menu</label>
<nav class="menu">
  <a href="/home">Home</a>
  <a href="/about">About</a>
</nav>

<style>
.menu { display: none; }
#menu-toggle:checked ~ .menu { display: block; }
</style>
```

**2. Image Carousels**

```html
<div class="carousel">
  <img src="image1.jpg">
  <img src="image2.jpg">
  <img src="image3.jpg">
</div>

<script>
// JavaScript handles showing one image at a time
</script>
```

**With JavaScript:** One image at a time with navigation  
**Without JavaScript:** All images stacked vertically

**Why it failed:** No CSS fallback for layout

**3. Modal Dialogs**

```html
<button onclick="openModal()">Open Dialog</button>
<div id="modal" style="display:none">
  <h2>Important Message</h2>
  <p>Content here</p>
  <button onclick="closeModal()">Close</button>
</div>
```

**With JavaScript:** Modal pops up, overlay appears  
**Without JavaScript:** Dialog never appears, user can't access content

**Why it failed:** Content hidden by default

### Minor Injuries (Mostly Fine)

**1. Progressive Forms**

```html
<form action="/submit" method="POST">
  <input name="email" type="email" required>
  <button type="submit">Submit</button>
</form>

<script>
// Enhance with real-time validation
document.querySelector('form').addEventListener('input', validateRealtime);
</script>
```

**With JavaScript:** Real-time validation, helpful feedback  
**Without JavaScript:** HTML5 validation, basic feedback, but form works

**Why it survived:** Form works with just HTML, JavaScript adds enhancements

**2. Lazy Loading with Fallback**

```html
<img 
  data-src="large-image.jpg" 
  src="placeholder.jpg"
  onload="lazyLoad(this)"
/>

<noscript>
  <img src="large-image.jpg">
</noscript>
```

**With JavaScript:** Loads images as you scroll (performance optimization)  
**Without JavaScript:** Loads all images immediately (works, just slower)

**Why it survived:** Fallback provided

## The Investigation: Testing Real Websites

**Detective:** Let's visit actual crime scenes. What still works?

### Test 1: Wikipedia

**With JavaScript disabled:**
- ✅ All content visible
- ✅ Navigation works
- ✅ Search works (server-side)
- ✅ Links work
- ❌ Some interactive features missing (collapsible sections)

**Verdict:** 95% functional. Excellent progressive enhancement.

### Test 2: Gmail

**With JavaScript disabled:**
- ❌ "Please enable JavaScript" message
- ❌ No email access
- ❌ Complete failure

**Verdict:** 0% functional. Completely JS-dependent.

### Test 3: GitHub

**With JavaScript disabled:**
- ✅ View repositories
- ✅ View code
- ✅ Read issues
- ❌ Some features broken (live search, real-time updates)
- ❌ Complex interactions don't work

**Verdict:** 70% functional. Core features work.

### Test 4: Twitter/X

**With JavaScript disabled:**
- ❌ Infinite scroll broken (can't load more tweets)
- ❌ Can't post tweets
- ❌ Most features broken

**Verdict:** 20% functional. Can view some content, but severely limited.

### Test 5: Amazon

**With JavaScript disabled:**
- ✅ Browse products
- ✅ View details
- ✅ Add to cart
- ✅ Checkout works!
- ❌ Some enhancements missing (image zoom, recommendations)

**Verdict:** 85% functional. Core shopping experience intact.

## The Suspects: Why JavaScript Became Mandatory

### Suspect 1: The Framework Developers

**Interrogation:**

**Detective:** Why do your apps require JavaScript?

**React Developer:** We're building rich interactive applications! You can't do that with just HTML.

**Detective:** But what about users who disable JavaScript?

**React Developer:** That's like... 0.2% of users. And server-side rendering is hard.

**Detective:** So you made a choice?

**React Developer:** (defensive) We provide SSR options! It's just... most developers don't use them.

**Verdict:** Guilty of making JavaScript-only apps the default, but not malicious.

### Suspect 2: The Product Managers

**Interrogation:**

**Detective:** Why does your site require JavaScript?

**PM:** We need analytics, A/B testing, personalization, real-time updates, infinite scroll...

**Detective:** Could any of that work without JavaScript?

**PM:** Technically yes, but it would take longer to build. And we need to ship features fast.

**Detective:** So speed over accessibility?

**PM:** (uncomfortable) We make trade-offs.

**Verdict:** Guilty of prioritizing features over robustness.

### Suspect 3: The Advertisers

**Interrogation:**

**Detective:** Why do ads require JavaScript?

**Ad Network:** Tracking, targeting, fraud prevention, viewability metrics, dynamic creative...

**Detective:** But users trying to avoid tracking disable JavaScript.

**Ad Network:** Then they don't see ads. That's their choice.

**Detective:** And your revenue?

**Ad Network:** Exactly.

**Verdict:** Guilty of requiring JavaScript for business model, unapologetic.

## The Evidence: What We Lost

### Progressive Enhancement (The Old Way)

```html
<!-- Layer 1: HTML (works everywhere) -->
<form action="/search" method="GET">
  <input name="q" type="text">
  <button type="submit">Search</button>
</form>

<!-- Layer 2: CSS (makes it pretty) -->
<style>
form { display: flex; gap: 0.5em; }
input { flex: 1; }
</style>

<!-- Layer 3: JavaScript (adds enhancements) -->
<script>
// Add autocomplete, but form still works without it
</script>
```

**Philosophy:** Start with working HTML. Add CSS for styling. Add JavaScript for enhancement.

**Result:** Site works for everyone, enhanced for those with capabilities.

### JavaScript-First (The New Way)

```jsx
// Layer 1: JavaScript (required)
function SearchForm() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await fetchResults(query);
    setResults(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

**Philosophy:** JavaScript handles everything.

**Result:** Rich interactions, but nothing works without JavaScript.

## The Debate: Should Sites Work Without JavaScript?

### Team "Yes, Websites Should Work Without JavaScript"

**Arguments:**

1. **Accessibility:** Screen readers, older browsers, assistive devices
2. **Performance:** HTML loads fast, JavaScript is slow
3. **Reliability:** JavaScript can fail to load (network issues, CDN down, blocked)
4. **Progressive enhancement:** Start with working foundation
5. **SEO:** Search engines can read HTML, struggle with JS-rendered content
6. **Privacy:** Users disabling JavaScript for tracking protection

**Example victims:**
- Users on slow connections (loads HTML but JavaScript times out)
- Corporate firewalls blocking CDNs
- Browser extensions blocking trackers (also block some JavaScript)
- Search engine bots (sometimes)

### Team "No, JavaScript Is Required for Modern Web Apps"

**Arguments:**

1. **User expectations:** Users expect rich interactions
2. **Developer productivity:** Frameworks make development faster
3. **Tiny minority:** < 0.5% of users disable JavaScript
4. **Workarounds exist:** SSR, static generation
5. **App-like experiences:** Can't build Gmail without JavaScript
6. **Business requirements:** Real-time features, analytics, personalization

**Example requirements:**
- Collaborative editing (Google Docs)
- Real-time updates (chat, notifications)
- Complex interactions (drag-and-drop, drawing apps)
- Client-side state management

## The Verdict: When JavaScript Is Justified

### JavaScript Is Justified For:

**1. Actual Web Applications**

Gmail, Figma, Google Docs - these are applications that happen to run in a browser. They can't work without JavaScript.

**2. Rich Interactions**

Drag-and-drop, drawing, games, collaborative editing - these need JavaScript.

**3. Real-Time Features**

Chat, live notifications, collaborative cursors - these need JavaScript.

### JavaScript Is NOT Justified For:

**1. Content Sites**

Blogs, news sites, documentation - these should work with just HTML.

**2. Basic Forms**

Login, signup, search - these should work without JavaScript (can be enhanced).

**3. Navigation**

Menus, links, pagination - these should never require JavaScript.

**4. Reading Content**

Articles, comments, reviews - these should be HTML.

## The Solution: Hybrid Approach

### Strategy 1: Server-Side Rendering (SSR)

```jsx
// Next.js example
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

export default function Page({ data }) {
  return <div>{data.content}</div>;
}
```

**Result:** 
- HTML is rendered on server
- Page works without JavaScript
- JavaScript enhances it when available

### Strategy 2: Progressive Enhancement

```html
<!-- Works without JavaScript -->
<form action="/search" method="GET">
  <input name="q">
  <button>Search</button>
</form>

<!-- Enhanced with JavaScript -->
<script>
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  // Fetch results and update page without reload
});
</script>
```

### Strategy 3: Graceful Degradation

```html
<div class="interactive-feature">
  <noscript>
    <p>This feature requires JavaScript. 
       <a href="/static-version">View static version</a>
    </p>
  </noscript>
</div>
```

Provide alternative for users without JavaScript.

## The Final Report

**Cause of death:** Dependency on JavaScript without fallbacks

**Contributing factors:**
- Framework defaults
- Developer convenience
- Business requirements
- Analytics and ads

**Could it have been prevented?** Yes, with progressive enhancement

**Will it happen again?** Probably, because JavaScript-first is easier

## Key Takeaways

1. **< 0.5% of users disable JavaScript** - But that's still millions of people
2. **JavaScript can fail to load** - Network issues, blockers, errors
3. **Core content should be HTML** - JavaScript should enhance, not enable
4. **Apps are different from websites** - Gmail needs JS, your blog doesn't
5. **SSR is a compromise** - Works without JS, enhanced with JS
6. **Test without JavaScript** - You'll find broken assumptions
7. **Use semantic HTML** - Forms work without JavaScript if built correctly

## Conclusion

The internet didn't die when JavaScript was disabled. It just revealed which sites were built on solid foundations and which were houses of cards.

Wikipedia still works. Gmail doesn't. Both are acceptable choices for their use cases.

The crime isn't requiring JavaScript. The crime is requiring JavaScript for things that should be HTML.

**Remember:** If your blog requires JavaScript to display text, you're doing it wrong. If your web application requires JavaScript to function, you're doing it right. Know the difference.

---

*Have you browsed the web without JavaScript? Discovered a site that breaks spectacularly? Built something that works both ways? Share your findings.*
