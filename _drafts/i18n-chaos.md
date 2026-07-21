---
layout: post
unique_id: WEB-09

title: My Website Speaks 47 Languages But Still Says "Loading..." Wrong
subtitle: The chaos of internationalization and localization
tldr: RTL layouts breaking CSS, pluralization rules across languages, date formats, currency symbols, and that one language that broke everything. Welcome to the wonderful chaos of making your website work for the entire planet.
# permalink: /blog/web/i18n-chaos
author: srungta
tags:
  - Web
  - i18n
  - l10n
  - Localization

series:
  id: WEB
  index: 8
---


## The Setup: "Let's Just Add a Language Dropdown"

**Product Manager:** We want to expand internationally. Can we just add a language selector?

**Developer:** Sure! How hard can it be? I'll add a translation file.

**3 months later...**

**Developer:** (staring at broken layout) Why is Hebrew text overflowing the button?

**Developer:** (reading bug report) What do you mean "2 days" is grammatically wrong in Polish?

**Developer:** (debugging date picker) How can February 30th be a valid date?!

This is internationalization (i18n) and localization (l10n). Where every language has its own opinion about how the world should work.

## The Easy Part (Spoiler: There Is No Easy Part)

### Translation Files

```javascript
// en.json
{
  "welcome": "Welcome",
  "loading": "Loading...",
  "items_count": "You have {count} items"
}

// es.json
{
  "welcome": "Bienvenido",
  "loading": "Cargando...",
  "items_count": "Tienes {count} artículos"
}
```

**What could go wrong?**

Everything. Let's start.

## Problem 1: Text Direction (Everything Flips)

You add Arabic. Suddenly your entire layout is backwards.

### What RTL (Right-to-Left) Breaks

**Your carefully crafted CSS:**

```css
.container {
  padding-left: 20px;
  text-align: left;
  margin-right: auto;
}
```

**In Arabic/Hebrew:** Should be:

```css
.container {
  padding-right: 20px;  /* Flipped! */
  text-align: right;    /* Flipped! */
  margin-left: auto;    /* Flipped! */
}
```

**Your carefully positioned icons:**

```html
<button>
  <span class="icon-arrow-right"></span>
  Next
</button>
```

**In RTL:** The arrow should point LEFT and appear on the LEFT side.

### The Naive Solution

```css
[dir="rtl"] .container {
  padding-left: 0;
  padding-right: 20px;
  text-align: right;
}

[dir="rtl"] .icon-arrow-right {
  transform: scaleX(-1); /* Flip the arrow */
}
```

**New problem:** Now you have duplicate CSS for every layout rule. Your stylesheet doubles in size.

### The Better Solution

```css
/* Use logical properties */
.container {
  padding-inline-start: 20px;  /* Auto-flips in RTL */
  text-align: start;            /* Auto-flips in RTL */
  margin-inline-end: auto;      /* Auto-flips in RTL */
}
```

**Still breaks:** Absolute positioning, Flexbox ordering, Grid column placement, background positions, border-radius corners...

## Problem 2: Pluralization (Numbers Are Hard)

English has 2 plural forms:
- 1 item (singular)
- 2+ items (plural)

Easy, right?

### Welcome to Polish

Polish has **3** plural forms:
- 1 item: "1 przedmiot"
- 2-4 items: "2 przedmioty"  
- 5+ items: "5 przedmiotów"

**Your code:**

```javascript
function getItemsText(count) {
  return count === 1 
    ? `${count} item` 
    : `${count} items`;
}
```

**Polish developer:** This is wrong for count = 2.

### Welcome to Arabic

Arabic has **6** plural forms:
- 0 items
- 1 item
- 2 items (special dual form)
- 3-10 items
- 11-99 items
- 100+ items

**Your simple ternary:** 💀

### The Solution (It's Complicated)

```javascript
// Use Intl.PluralRules
const pluralRules = new Intl.PluralRules('pl-PL');

function getItemsText(count) {
  const rule = pluralRules.select(count);
  // rule can be: "zero", "one", "two", "few", "many", "other"
  
  const translations = {
    one: 'przedmiot',
    few: 'przedmioty',
    many: 'przedmiotów',
    other: 'przedmiotów'
  };
  
  return `${count} ${translations[rule]}`;
}
```

**But wait, there's more:** Some languages (like Chinese) don't have plural forms at all. Same word for 1 or 100 items.

## Problem 3: Date and Time (Calendars Are Arbitrary)

**You:** February has 28 days (29 in leap years). That's universal.

**Persian Calendar:** Haha, no.

**Islamic Calendar:** We have 12 months but they're different lengths and different from your months.

**Japanese Calendar:** What year is it? Oh, it's Reiwa 8 (2026 in Gregorian).

### The Date Display Problem

```javascript
const date = new Date('2026-03-03');

// US: 3/3/2026
// Europe: 3/3/2026 (wait, is this March 3 or 3rd of March?)
// ISO: 2026-03-03
// Japan: 令和8年3月3日
```

**Different formats:**
- MM/DD/YYYY (US)
- DD/MM/YYYY (Europe)
- YYYY-MM-DD (ISO, sane people)
- YYYY年MM月DD日 (Japanese)

**Your code that assumes slashes:**

```javascript
function parseDate(str) {
  const [month, day, year] = str.split('/');
  return new Date(year, month - 1, day);
}
```

**European user enters "3/12/2026":**
- They mean: December 3, 2026
- Your code thinks: March 12, 2026

**Both are valid dates. How do you know which they meant?**

### The Solution

```javascript
// Let the browser handle it
const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

formatter.format(new Date()); // "March 3, 2026"

// For parsing, pray they use a date picker
```

## Problem 4: Currency (Money Is Complicated)

**You:** I'll just add a dollar sign!

```javascript
const price = `$${amount}`;
```

**Japan:** We use ¥ and don't have decimal places. ¥100 not ¥100.00.

**Europe:** We use € and it goes AFTER the number. 100€ not €100.

**Germany:** We use , for decimals. 100,50€ not 100.50€.

**India:** We use ₹ and group digits differently. ₹1,00,000 not ₹100,000.

### The Numbers Problem

```javascript
const price = 1234567.89;

// US: 1,234,567.89
// Germany: 1.234.567,89
// France: 1 234 567,89
// India: 12,34,567.89
```

**Your parser that splits on commas:** 💀

### The Solution

```javascript
const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
});

formatter.format(1234.56); // "1.234,56 €"
```

**But wait:** User is in Germany but wants prices in USD. Do you show:
- $1,234.56 (American format with USD)
- 1.234,56 $ (German format with USD)

**There's no right answer.**

## Problem 5: String Length (What's a Character?)

**You:** I'll limit usernames to 20 characters.

```javascript
if (username.length > 20) {
  throw new Error('Username too long');
}
```

**Chinese user:** My name is 李明. That's 2 characters. Why is it rejected?

**Emoji user:** My name is 👨‍👩‍👧‍👦. That's 1 character (family emoji). Why does `.length` return 11?

### The Character Problem

```javascript
'hello'.length;        // 5 (okay)
'你好'.length;         // 2 (okay)
'👨‍👩‍👧‍👦'.length;      // 11 (WAT)
'é'.length;            // 1 or 2 (depends on normalization)
```

JavaScript `.length` counts UTF-16 code units, not actual characters.

**Emoji with ZWJ (Zero-Width Joiner):**
- 👨‍👩‍👧‍👦 is actually: 👨 + ZWJ + 👩 + ZWJ + 👧 + ZWJ + 👦
- Displays as 1 glyph
- Counted as 11 by `.length`

### The Solution

```javascript
// Use Array.from to get actual grapheme count
Array.from('👨‍👩‍👧‍👦').length;  // Still 7 (not quite right)

// Use Intl.Segmenter (new API)
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const segments = segmenter.segment('👨‍👩‍👧‍👦');
Array.from(segments).length;  // 1 (correct!)
```

## Problem 6: Sorting (Alphabetical Order Is Not Universal)

**You:** I'll sort names alphabetically.

```javascript
names.sort(); // Done!
```

**Swedish user:** Why is 'Ä' at the end? It should come after 'A'.

**German user:** Why is 'Ä' sorted separately? It should be treated like 'AE'.

**Spanish user:** Why is 'ñ' between 'n' and 'o'? It's a separate letter that comes after 'n'.

**Danish user:** 'Å' comes after 'Z', not after 'A'.

### The Solution

```javascript
// Use localeCompare with locale
names.sort((a, b) => a.localeCompare(b, 'sv-SE'));

// Swedish: A, B, C, ..., Z, Å, Ä, Ö
// German: A (including Ä), B, C, ..., Z
```

**But wait:** Your database does ASCII sorting. Your JavaScript does locale-aware sorting. They disagree.

## Problem 7: Text That Doesn't Fit

**You:** I designed this button for "Save". 4 characters. Perfect.

**German:** "Speichern". 10 characters. Button explodes.

**French:** "Enregistrer". 12 characters. Layout breaks.

**Finnish:** "Tallentaa". 9 characters. Also breaks.

### The CSS Problem

```css
.button {
  width: 100px;  /* Fits "Save" */
  white-space: nowrap;
  overflow: hidden;
}
```

**Result:** "Speiche..." (truncated)

**Solution:** Don't set fixed widths. Let content determine size.

```css
.button {
  padding: 0.5em 1em;  /* Grows with content */
}
```

**New problem:** German button is huge. Now all buttons need to be huge for consistency.

## Problem 8: Gender (Everything Is Gendered)

**English:** "You have 1 message"

**French:** 
- "Vous avez 1 message" (masculine)
- "Vous avez 1 nouvelle" (feminine - depends on what the message is)

**German:**
- "Der Benutzer" (male user)
- "Die Benutzerin" (female user)

**Your simple translation file:**

```json
{
  "message_count": "You have {count} messages"
}
```

**French translator:** I need to know what the messages are to choose the right word.

**German translator:** I need to know the user's gender to use the right article.

### The Solution (There Isn't One)

Some libraries support gender/context:

```json
{
  "message_count": {
    "male": "Du hast {count} Nachrichten",
    "female": "Du hast {count} Nachrichten",
    "other": "Du hast {count} Nachrichten"
  }
}
```

**New problem:** Not all users want to specify gender. And some languages have more than 2 genders.

## Problem 9: Fonts (Unicode Is Huge)

**You:** I'll use Arial. Universal font!

**Chinese user:** Arial doesn't have Chinese characters. I see boxes.

**Arabic user:** Arial's Arabic glyphs are terrible.

**Emoji user:** Arial has no emoji. I see □□□.

### The Solution

```css
font-family: 
  -apple-system, 
  BlinkMacSystemFont, 
  "Segoe UI", 
  Arial, 
  sans-serif,
  "Apple Color Emoji",     /* Emoji on Mac */
  "Segoe UI Emoji",        /* Emoji on Windows */
  "Noto Color Emoji";      /* Emoji on Linux */
```

**Problem:** Font fallback chain gets ridiculous. And you still need web fonts for consistent branding.

**Web font problem:** 
- Latin font: 50 KB
- + Chinese font: 5 MB (need all characters)
- + Arabic font: 200 KB
- + Emoji font: 1 MB
- Total: 6.25 MB just for fonts

## Problem 10: That One Language That Breaks Everything

**You:** We support 46 languages. What could go wrong?

**You:** Let's add Mongolian.

**Developer:** (reading Wikipedia) Mongolian is written... vertically? Top to bottom?

**CSS:** (sweating)

**Mongolian** is traditionally written top-to-bottom, left-to-right (columns go left to right).

**Your horizontal layout:** 💀

```css
.mongolian {
  writing-mode: vertical-lr;  /* Vertical lines, left to right */
}
```

**Problem:** Every single layout assumption breaks. Buttons, forms, tables, navigation - everything needs to be rethought.

## Real-World Horror Stories

### Story 1: The Turkish I

Turkish has two letter 'i':
- i (lowercase) → İ (uppercase - with dot)
- ı (lowercase - no dot) → I (uppercase)

```javascript
'istanbul'.toUpperCase(); // In Turkish: "İSTANBUL" not "ISTANBUL"
```

**Your case-insensitive comparison:**

```javascript
if (userInput.toUpperCase() === 'ISTANBUL') // Fails in Turkish locale
```

### Story 2: The Thai Word Boundaries

Thai doesn't use spaces between words.

**English:** "Hello world" (space separates words)

**Thai:** "สวัสดีโลก" (no spaces)

**Your word-wrap CSS:**

```css
word-break: break-word;  /* Breaks mid-word in Thai */
```

Thai needs dictionary-based word breaking to wrap correctly.

### Story 3: The Emoji That Cost $10,000

User changed their name to: 👨‍👩‍👧‍👦

**Your database column:** `VARCHAR(20)`

**Family emoji:** Takes 11 UTF-16 code units but displays as 1 character

**Your validator:** "Name is 1 character, that's fine"

**Your database:** "This is 11 characters, rejected"

**Support tickets:** 50+ users confused why their names are rejected

**Fix cost:** Database migration, validator rewrite, regression testing

## Key Takeaways

1. **Never assume ASCII** - The world has 140,000+ characters
2. **Never hardcode formats** - Dates, numbers, currency are all locale-specific
3. **Never assume LTR** - RTL languages exist
4. **Never count characters** - Use grapheme segmentation
5. **Never assume English grammar** - Pluralization is complex
6. **Never hardcode sorting** - Use `localeCompare`
7. **Never set fixed widths** - Text length varies wildly
8. **Never assume spaces** - Some languages don't use them
9. **Test with real languages** - Don't just test with English + one other
10. **Use i18n libraries** - Don't roll your own

## Conclusion

Internationalization is hard because the world is messy. Languages have wildly different rules, and every assumption you make breaks for some language.

The good news: Modern browsers have great i18n APIs (`Intl` namespace). Use them.

The bad news: You still need to design layouts that work in RTL, handle text that's 3x longer, and somehow fit vertical text into your horizontal layout.

**Remember:** If your website says "Loading..." in 47 languages but breaks when someone enters their actual name, you've failed. Start with the hard stuff first.

---

*Have you broken a layout with RTL? Discovered a language with 7 plural forms? Share your i18n horror stories.*
