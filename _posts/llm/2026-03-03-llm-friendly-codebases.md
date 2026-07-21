---
layout: post
unique_id: LLMCODE01

title: Making Your Codebase LLM Friendly
subtitle: Simple practices to help AI assistants understand and work with your code effectively
tldr: Treat LLMs like new hires on your team. The same things that help human developers also help AI - clear patterns, good documentation, and consistent conventions.
permalink: /blog/llm/llm-friendly-codebases
cover: /assets/images/llm/LLMCODE01/cover.svg
image: /assets/images/llm/LLMCODE01/cover.png
author: srungta
tags:
  - LLM
  - Code Quality
  - Best Practices
  - AI Assistants

series:
  id: LLM
  index: 2

---

## What Does "LLM Friendly" Really Mean?

Think about the last time someone new joined your team. What did they struggle with?

- Finding where things are
- Understanding why things work a certain way
- Figuring out what patterns to follow
- Knowing what's okay to change and what isn't

LLMs face the exact same challenges. An "LLM friendly" codebase is simply one where these answers are easy to find.

> The trick is to write code that anyone (or anything 😉) can understand.

## Why This Matters Now

LLMs are already writing code in production systems. Tools like GitHub Copilot, Codex, and Claude are generating pull requests, fixing bugs, and adding features. The question isn't whether to use them - it's how to use them effectively.

I have been using most of the new coding models on a daily basis for fun and for production code.
Here are some of my findings that helped me reduce iterations with my agents.

{% capture core_insight %}
To get the best out of your LLM agents:

1. **Make it easy to write good code**
2. **Make it hard to write bad code**
   {% endcapture %}
   {% include highlight.html title="Core Insight" content=core_insight %}

Let's explore what this means in practice.

## Making It Easy to Write Good Code

### 1. Write Code in Predictable Ways

> LLMs are pattern-matching machines. When your codebase has consistent patterns, LLMs can accurately replicate them.

**What this means in practice:**

- The way you write logs should be standardized across the codebase
- Configuration handling should follow the same pattern everywhere
- API endpoint naming should be predictable
- Folder structures should be consistent
- File naming should match what's inside

**Example Scenario**:  
If you have 10 controllers that all follow the same structure - constructor, private methods, public methods, error handling - when an LLM creates the 11th controller, it will naturally follow the same pattern.

**Why it works**:  
LLMs learn from the code they see. Consistent patterns mean the LLM has strong signals about how to write new code. Inconsistent patterns mean the LLM has to guess, and guesses lead to errors.

### 2. Have Reference Files for Coding Styles

> One good example is worth a thousand words of explanation.

**What to include:**

- A well-written test file that shows your testing patterns
- A reference controller that demonstrates your preferred structure
- Example configuration files that show the right way to set things up
- Sample pipeline definitions if you use CI/CD

{% capture my_note %}
Make sure the reference file is **of high quality**. A bad reference file is worse than no reference file.  
The LLM will replicate the problems.
{% endcapture %}
{% include note.html type="error" content=my_note %}

### 3. Create Base Documentation for Project Structure

> LLMs need to understand the big picture before they can work on specific pieces.

**Create a document that answers:**

- What does this project do?
- How is the code organized? (What goes where?)
- What are the key conventions we follow?
- What external systems do we integrate with?
- What's our approach to error handling?

This doesn't need to be elaborate. A simple README or ARCHITECTURE.md file that gives the 30,000-foot view is enough.

**Why it matters**:  
Without this context, LLMs either load a lot of context by scanning through files or make assumptions. With this context, they make informed decisions.

### 4. Make Similar Things Look Similar

> If two things do similar jobs, they should look similar in code.

This is especially powerful for:

- **Pipeline definitions** - Infrastructure-as-code files like Bicep, ARM templates, GitHub Actions, or Azure DevOps YAML should follow templates
- **API endpoints** - If you have 20 REST endpoints, they should all follow the same pattern for routing, validation, and error handling
- **Database queries** - Query patterns should be consistent (parameterized, error handling, connection management)

**What happens when you do this**:  
LLMs become extremely good at replicating well-defined patterns. If your pipeline files all look alike, the LLM can create new ones with high accuracy.

### 5. Provide Examples in Requirements

> Task descriptions with examples produce better results than task descriptions with just text.

❌ **Instead of:**

```
Add validation for the email field
```

✅ **Write:**

```
Add validation for the email field.

Example of how we validate in UserController.cs:
- Check if email is not null
- Check if email matches regex pattern
- Return ValidationError if check fails

Follow the same pattern we use for phone number validation in the same file.
```

**Why it works**:  
LLMs are one-shot generators for most PR tools. They don't get to iterate with you. More context upfront = better first attempt.

### 6. Keep Changes Small and Focused

> One change per PR works better than multiple changes in one PR.

LLMs are getting exceedingly good at making large changes in one shot. However, the more changes that are made, the more you have to review. This applies to both human-written and LLM-written code, but it's especially important for LLMs because:

- Larger scope has more chances of deviations from objective.
- Small, hard-to-catch bugs can seep in when a lot of files are changed.

**What to avoid**:  
"Refactor the entire service layer and add three new features" is too much for one task.

**What works better**:  
"Add email validation to UserController following the pattern in UserValidator.cs"

> It also works fine if you give a structured list of changes in multiple files to steer the direction of changes.

## Making It Hard to Write Bad Code

These are guardrails that prevent LLMs (and humans) from making common mistakes.

### 1. Use Linters and Code Analysis Rules

> Most LLM-based coding agents use builds as a way to validate their changes. If the build fails, they fix and retry.

This means linters are incredibly powerful for steering LLM behavior.

**What to enforce:**

- Code style rules (consistent formatting, naming conventions)
- Code analysis rules (potential bugs, security issues)
- Static analysis (unused variables, unreachable code)
- Custom rules specific to your domain

{% capture core_insight %}
If something is important enough that you comment on it during code reviews, make it a linter rule instead.
{% endcapture %}
{% include highlight.html title="💡Tip" content=core_insight %}

**Why this is powerful**:  
Linters give immediate feedback. LLMs see the error, understand what's wrong, and fix it automatically. This creates a tight feedback loop that improves code quality without human intervention.

### 2. Break Builds on Violations (Not Just Warnings)

> Some LLMs ignore warnings. They only fix errors that break the build. If something is important, make it an error, not a warning.

**Example:**

- Security rule violations → Break the build
- Required documentation missing → Break the build
- Code coverage below threshold → Break the build
- Naming convention violations → Break the build

**The tradeoff**:  
This might seem strict, but it's actually liberating. It makes the rules explicit and automatic. Nobody has to remember to check; the build checks automatically.

### 3. Avoid Suppression Files, Use Inline Suppressions

> Some LLMs use global suppression files as an escape hatch when problems become complex.

**What happens with suppression files**:  
Sometimes, when the LLM can't fix a code analysis error, it adds a suppression to a global file and moves on. This accumulates technical debt.

**Better approach**:  
Require inline suppressions with justification:

```csharp
#pragma warning disable CA1031 // Do not catch general exception types
// We need to catch all exceptions here because this is the top-level error handler
catch (Exception ex)
{
    // handle
}
#pragma warning restore CA1031
```

**Why this works**:  
Inline suppressions are visible during code review. They force the developer (human or AI) to justify why the rule doesn't apply in this specific case.

### 4. Have Tests that LLMs Can Follow

> If you have one well-written test, LLMs can generate more tests following the same pattern.

**What makes a good reference test:**

- Clear arrange-act-assert structure
- Descriptive test names that explain what's being tested
- Good use of test helpers and fixtures
- Appropriate assertions

**Instruction that works well**:

```
Add tests for the new validation logic.
Follow the pattern in UserValidationTests.cs.
Use the same helper methods and assertion style.
```

**What to avoid**:  
Don't let LLMs add unnecessary tests just to increase coverage. Specify "add relevant tests only" in your requirements.

## Practical Tips for Faster Iterations

### 1. Set Up Quick Validation Builds

> If your build takes 20 minutes and the LLM runs 5 iterations, the time just adds up.

**The Solution**: Create a lightweight "quick validation" build specifically for LLM iterations:

- Skip time-consuming steps that aren't relevant (deployment, packaging, slow integration tests)
- Run only linters, unit tests, and fast validations
- For agent-based PRs, save the full build for final PR validation and use the simpler build before agents publish the PR.

### 2. Add Instructions to Avoid Common Issues

> LLMs sometimes add things you don't want. Be explicit about what NOT to do.

**Examples of useful negative instructions:**

```
- Don't add suppression files unless absolutely necessary
- Don't add markdown files for explanation
- Don't add unnecessary comments
- Don't add tests that just verify implementation details
```

**Why this matters**:  
LLMs often try to be "helpful" by adding extra documentation or comments. If you don't want that, say so explicitly.

## Continuous Improvement Strategy

You don't need to fix everything at once. Here's a gradual approach based on what has the highest impact:

### Phase 1: Foundation (Week 1-2)

1. ✅ Create a README with project structure and conventions
2. ✅ Identify and document your most common patterns (logging, error handling, configuration)
3. ✅ Create reference files for common tasks (tests, controllers, services)

### Phase 2: Guardrails (Week 3-4)

1. ✅ Enable linters and code analysis rules
2. ✅ Make important rules break the build (not just warnings)
3. ✅ Remove global suppression files; require inline suppressions

### Phase 3: Optimization (Ongoing)

1. ✅ Set up quick validation builds for faster iterations
2. ✅ Test with LLMs and refine based on results
3. ✅ Add instructions files like copilot-instructions and claude skills to avoid common issues

> Start with the area of your codebase that changes most frequently. That's where you'll see the biggest return on investment.

## Hacks and Tricks from the Field

### Use Voice Typing for Task Descriptions

Adding context is important, but typing detailed task descriptions is tedious. Use voice typing to:

- Add more detail without typing fatigue
- Provide richer context naturally
- Explain examples and patterns verbally

**Why it works**: People naturally provide more context when speaking than when typing.

### Have a Copilot Instructions File

Create a `.github/copilot-instructions.md` file (or similar) that tells LLMs:

- What patterns to follow in your codebase
- What to avoid
- How to structure code
- What good looks like

This file is picked up by Copilot and other tools, reducing the need to repeat instructions in every task.

## Key Takeaways

1. **Treat LLMs like new team members** - The same things that help humans also help AI
2. **Consistency beats perfection** - A consistent mediocre pattern is better than inconsistent excellent patterns
3. **Make good code easy** - Clear patterns guide LLMs toward quality
4. **Make bad code hard** - Linters and build rules prevent common mistakes
5. **Provide examples** - One good reference file beats long written instructions
6. **Be explicit** - Say what you want AND what you don't want
7. **Iterate based on results** - Learn what prompts work and refine your approach
8. **Start small** - Fix high-change areas first, then expand gradually

## Conclusion

Making your codebase LLM-friendly isn't about writing code for robots. It's about writing clearer, more maintainable code that communicates its intent effectively to anyone reading it - human or AI.

The practices in this post are fundamentally about good software engineering: consistent patterns, clear documentation, automated quality checks, and explicit conventions. These practices have always made codebases better for humans. LLMs just make the benefits more obvious and immediate.
