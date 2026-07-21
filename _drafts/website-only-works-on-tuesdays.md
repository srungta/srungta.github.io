---
layout: post
unique_id: WEB-04

title: I Built a Website That Only Works on Tuesdays
subtitle: A love letter to temporal logic and all the ways time will betray you
tldr: Time is the silent killer of production systems. Time zones, daylight saving, leap seconds, and the fact that Tuesday in Tokyo isn't Tuesday in New York - let's build increasingly absurd time-based systems and watch them fail spectacularly.
# permalink: /blog/web/website-only-works-on-tuesdays
author: srungta
tags:
  - Web
  - System Design
  - Time
  - Debugging

series:
  id: WEB
  index: 3
---


## The Premise: Tuesday-Only Website

What if I told you I built a website that literally only works on Tuesdays? Not because of maintenance windows or deployment schedules, but because I *wanted* it to.

Here's the catch: it needs to work on Tuesdays *everywhere in the world*. At the same time.

Spoiler alert: This is impossible. And trying to make it work teaches you everything you need to know about temporal logic in distributed systems.

## Why Time is Your Enemy

Time seems simple when you're writing code on your laptop in one time zone. Then you deploy to production and discover:

- **Tuesday in Tokyo happens before Tuesday in New York**
- **Daylight saving time means "1 hour from now" might be wrong**
- **Leap seconds exist and occasionally break the internet**
- **Your server's clock is probably wrong**
- **NTP drift means two servers disagree about "now"**
- **Users lie about their time zone**

Time isn't a number. Time is a distributed consensus problem that humanity has been solving incorrectly for centuries.

## Attempt 1: Just Check the Day

```javascript
// This will go wrong in so many ways
function isTuesday() {
  const today = new Date();
  return today.getDay() === 2; // 2 = Tuesday
}

if (isTuesday()) {
  showWebsite();
} else {
  showMessage("Come back on Tuesday!");
}
```

**What could go wrong?**

Everything.

- Your server is in UTC, your user is in Tokyo. It's Wednesday for them but Tuesday for you.
- You check at 11:59 PM on Tuesday. The page loads. They click a button at 12:01 AM Wednesday. Your API rejects the request.
- It's Tuesday in their time zone but they set their computer clock to Wednesday. Do you trust them?

## Attempt 2: Use the User's Time Zone

```javascript
function isTuesdayForUser() {
  const userTime = new Date().toLocaleString('en-US', { 
    timeZone: userTimeZone,
    weekday: 'long' 
  });
  return userTime === 'Tuesday';
}
```

**Better, but still broken:**

- How do you get the user's time zone? `Intl.DateTimeFormat().resolvedOptions().timeZone` is close but users can override it.
- VPN users appear to be in different time zones than they actually are.
- What about users on the International Date Line where Tuesday happens twice?
- Your JavaScript executes in the browser. Their system clock might be January 1, 1970.

## The Real Problem: There Is No "Tuesday"

Here's the existential crisis: **there is no single moment that is Tuesday for everyone**.

When you say "the website works on Tuesdays", you have to pick:

1. **Tuesday in UTC** - Simple but unfair to users in other time zones
2. **Tuesday in the user's time zone** - Complex and users can lie
3. **Tuesday for 24 consecutive hours starting when the earliest time zone hits Tuesday** - This means your "Tuesday" lasts 48 hours
4. **The intersection of Tuesday across all time zones** - This is approximately 0 hours

## Real-World Examples Where This Actually Matters

### Flash Sales

"Sale starts Tuesday at midnight!"

Midnight where? If you say midnight UTC, Asian users get screwed. If you say midnight in each time zone, you need 24 different sale windows and inventory management becomes hell.

**What usually happens:**  
Companies pick one time zone (usually Pacific Time because tech companies) and say "midnight PT". Everyone else does math.

### Scheduled Maintenance

"Maintenance window: Tuesday 2 AM - 4 AM"

- 2 AM where?
- What if maintenance runs long and hits 4:01 AM?
- What if daylight saving ends during your maintenance window and you get an extra hour?
- What if it begins and you lose an hour?

**What usually happens:**  
Maintenance takes longer than planned, users are mad, and someone gets paged at 3 AM.

### Subscription Renewals

"Your subscription renews on the 15th of each month"

- What happens on months with fewer than 31 days?
- User signed up on January 31st. When do they renew in February?
- Renewal happens at midnight UTC. User is charged at 4 PM their local time. They're confused.

## The Solutions (None of Them Perfect)

### Solution 1: Everything in UTC, Display in Local

Store all times in UTC. Display in user's local time. Accept that "Tuesday" means different things to different people.

**Pros:** Simple, consistent, no ambiguity  
**Cons:** Users think in their time, not UTC

### Solution 2: Store Time Zone with Every Timestamp

```javascript
{
  eventTime: "2026-03-03T12:00:00",
  timeZone: "America/New_York",
  displayTime: "Tuesday, March 3, 2026 at 12:00 PM EST"
}
```

**Pros:** Preserves original intent  
**Cons:** Time zones change. "America/New_York" might not mean the same thing in 10 years.

### Solution 3: Accept That Time is Relative

Build your system to handle time as a range, not a point.

"This event happens on Tuesday" becomes "This event is valid from first-Tuesday-UTC to last-Tuesday-UTC".

**Pros:** Honest about the ambiguity  
**Cons:** Requires explaining this to product managers

## Things That Will Definitely Break Your Time Logic

### Daylight Saving Time

Twice a year, clocks jump forward or backward. This means:

- One day has 23 hours
- One day has 25 hours
- "Same time tomorrow" is ambiguous
- Scheduling something for "2:30 AM" on the day clocks spring forward means that time doesn't exist

### Leap Seconds

Occasionally, the earth's rotation slows down slightly, and we add a leap second. This means:

- There are occasionally 61 seconds in a minute
- Your clock goes from 23:59:59 to 23:59:60 to 00:00:00
- Most systems ignore this and create a weird 1-second gap in logs

### Calendar Reform

Countries occasionally change their calendars. Samoa skipped December 30, 2011 entirely when they crossed the International Date Line.

If you're storing historical data, you need to know which calendar system was in use at the time.

## The Fun Part: Let's Build Increasingly Absurd Examples

### Example 1: Website Only Works on Full Moons

```javascript
function isFullMoon() {
  // The moon phase is the same everywhere on Earth, right?
  // Wrong. The "full moon" moment is a specific instant in UTC,
  // but people experience it at different local times.
  
  const moonPhase = calculateMoonPhase(new Date());
  return moonPhase > 0.95; // Close enough?
}
```

### Example 2: Website Only Works on Weekends

```javascript
function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday or Saturday
  
  // Except in some countries, the weekend is Friday/Saturday
  // And in some countries, there's a half-day on Friday
  // And during Ramadan, work schedules change
}
```

### Example 3: Website Only Works During Business Hours

```javascript
function isBusinessHours() {
  const hour = new Date().getHours();
  return hour >= 9 && hour < 17;
  
  // Whose business hours?
  // What about businesses that operate 24/7?
  // What about holidays?
  // What about businesses in multiple time zones?
}
```

## Key Takeaways

1. **There is no "now" in distributed systems** - Every server has a slightly different clock
2. **Never trust the client's clock** - Users can set it to anything
3. **Store times in UTC, display in local** - This is the least-worst option
4. **Time zones are not just offsets** - They have names, rules, and histories
5. **Daylight saving time will break your code** - Plan for it
6. **Be explicit about ambiguity** - "Tuesday" isn't specific enough

## Conclusion

Time is hard. Really hard. The only thing harder than dealing with time in software is explaining to a product manager why "just check if it's Tuesday" won't work.

My Tuesday-only website? I gave up and made it work on Wednesdays too. And Thursdays. And eventually every day because time is a lie we tell ourselves to make sense of chaos.

**Remember:** If your feature depends on time, you're already in trouble. The best you can do is minimize the damage and pray that users don't live near the International Date Line.

---

*Have you built something ridiculous with time? Have a horror story about time zones? Let me know - I collect these like other people collect stamps.*
