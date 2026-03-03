---
layout: post
unique_id: LLMCODE01

title: Making Your Codebase LLM Friendly
subtitle: Simple practices to help AI assistants understand and work with your code effectively
tldr: Treat LLMs like new hires on your team. The same things that help human developers also help AI - clear patterns, good documentation, and consistent conventions.
permalink: /blog/llm/llm-friendly-codebases
author: srungta
tags:
  - LLM
  - Code Quality
  - Best Practices
  - AI Assistants

series:
  id: LLM
  index: 2

featured: true
---
* TOC
{:toc}

## TL;DR - The One Thing to Remember

**Treat your LLM like a new hire on your team.**

Everything else flows from this simple principle. The things that help new developers understand your codebase also help LLMs. The practices that make it easy for humans to write good code also make it easy for AI.

## What Does "LLM Friendly" Really Mean?

Think about the last time someone new joined your team. What did they struggle with?
- Finding where things are
- Understanding why things work a certain way
- Figuring out what patterns to follow
- Knowing what's okay to change and what isn't

LLMs face the exact same challenges. An "LLM friendly" codebase is simply one where these answers are easy to find.

> This is not about writing code for AI. This is about writing better code that anyone (or anything) can understand.

## Why This Matters Now

LLMs are already writing code in production systems. Tools like GitHub Copilot, ChatGPT, and Claude are generating pull requests, fixing bugs, and adding features. The question isn't whether to use them - it's how to use them effectively.

Here's what we've learned from real-world usage:

**If your code is predictable, LLM-generated PRs are high quality** ✅  
When the patterns are consistent and the surrounding code is well-structured, LLMs generate code that works on the first try.

**If your work item descriptions are good, LLM-generated PRs are high quality** ✅  
Clear requirements with examples and references lead to PRs that need minimal revision.

**If your codebase has inconsistent patterns, LLMs will amplify the inconsistency** ❌  
Whatever patterns exist in your codebase, good or bad, will be replicated by the LLM.

## The Core Insight: Make It Easy to Write Good Code

The best way to get quality code from LLMs is to make good code the path of least resistance. This means two things:

1. **Make it easy to write good code**
2. **Make it hard to write bad code**

Let's explore what this means in practice.

## Making It Easy to Write Good Code

These are practices that guide LLMs toward generating quality code by showing them clear patterns to follow.

### 1. Write Code in Predictable Ways

**The Insight**: LLMs are pattern-matching machines. When your codebase has consistent patterns, LLMs can accurately replicate them.

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

**The Insight**: One good example is worth a thousand words of explanation.

**What to include:**
- A well-written test file that shows your testing patterns
- A reference controller that demonstrates your preferred structure
- Example configuration files that show the right way to set things up
- Sample pipeline definitions if you use CI/CD

**Real-world result**:  
In projects where reference files were provided, LLM-generated PRs required minimal changes. The LLM simply followed the pattern shown in the reference file.

> Make sure the reference file is of high quality. A bad reference file is worse than no reference file because the LLM will replicate the problems.

### 3. Create Base Documentation for Project Structure

**The Insight**: LLMs need to understand the big picture before they can work on specific pieces.

**Create a document that answers:**
- What does this project do?
- How is the code organized? (What goes where?)
- What are the key conventions we follow?
- What external systems do we integrate with?
- What's our approach to error handling?

This doesn't need to be elaborate. A simple README or ARCHITECTURE.md file that gives the 30,000-foot view is enough.

**Why it matters**:  
Without this context, LLMs make assumptions. With this context, they make informed decisions.

### 4. Make Similar Things Look Similar

**The Insight**: If two things do similar jobs, they should look similar in code.

This is especially powerful for:
- **Pipeline definitions** - Infrastructure-as-code files like Bicep, ARM templates, GitHub Actions, or Azure DevOps YAML should follow templates
- **API endpoints** - If you have 20 REST endpoints, they should all follow the same pattern for routing, validation, and error handling
- **Database queries** - Query patterns should be consistent (parameterized, error handling, connection management)

**What happens when you do this**:  
LLMs become extremely good at replicating well-defined patterns. If your pipeline files all look alike, the LLM can create new ones with high accuracy.

### 5. Provide Examples in Requirements

**The Insight**: Task descriptions with examples produce better results than task descriptions with just text.

**Instead of:**
```
Add validation for the email field
```

**Write:**
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

**The Insight**: One change per PR works better than multiple changes in one PR.

This applies to both human-written and LLM-written code, but it's especially important for LLMs because:
- Smaller scope = clearer objective
- Easier to validate = faster feedback loops
- Simpler to review = faster merging

**What to avoid**:  
"Refactor the entire service layer and add three new features" is too much for one task.

**What works better**:  
"Add email validation to UserController following the pattern in UserValidator.cs"

## Making It Hard to Write Bad Code

These are guardrails that prevent LLMs (and humans) from making common mistakes.

### 7. Use Linters and Code Analysis Rules

**The Insight**: Most LLM-based coding agents use builds as a way to validate their changes. If the build fails, they fix and retry.

This means linters are incredibly powerful for steering LLM behavior.

**What to enforce:**
- Code style rules (consistent formatting, naming conventions)
- Code analysis rules (potential bugs, security issues)
- Static analysis (unused variables, unreachable code)
- Custom rules specific to your domain

**Key principle:**  
If something is important enough that you comment on it during code reviews, make it a linter rule instead.

**Why this is powerful**:  
Linters give immediate feedback. LLMs see the error, understand what's wrong, and fix it automatically. This creates a tight feedback loop that improves code quality without human intervention.

### 8. Break Builds on Violations (Not Just Warnings)

**The Insight**: Some LLMs ignore warnings. They only fix errors that break the build.

If something is important, make it an error, not a warning.

**Example:**
- Security rule violations → Break the build
- Required documentation missing → Break the build  
- Code coverage below threshold → Break the build
- Naming convention violations → Break the build

**The tradeoff**:  
This might seem strict, but it's actually liberating. It makes the rules explicit and automatic. Nobody has to remember to check; the build checks automatically.

### 9. Avoid Suppression Files, Use Inline Suppressions

**The Insight**: LLMs use global suppression files as an escape hatch when problems become complex.

**What happens with suppression files**:  
When the LLM can't fix a code analysis error, it adds a suppression to a global file and moves on. This accumulates technical debt.

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

### 10. Have Tests that LLMs Can Follow

**The Insight**: If you have one well-written test, LLMs can generate more tests following the same pattern.

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

### 11. Set Up Quick Validation Builds

**The Problem**: If your build takes 30 minutes and the LLM runs 5 iterations, that's 2.5 hours just waiting for builds.

**The Solution**: Create a lightweight "quick validation" build specifically for LLM iterations:
- Skip time-consuming steps that aren't relevant (deployment, packaging, slow integration tests)
- Run only linters, unit tests, and fast validations
- Save the full build for final PR validation

**Real-world impact**:  
Teams that set up quick builds saw 3-4x faster PR generation times.

### 12. Publish PRs as Drafts Initially

**The Insight**: LLMs are iterating toward a working solution. Early iterations might not pass all checks.

**Configuration to use:**
```yaml
publishFinalPrAsDraft: true
```

**Why this helps:**
- Allows faster iterations without triggering expensive CI/CD pipelines
- Reduces wasted resources if the main build publishes artifacts to external systems
- Gives you a chance to review before triggering full automation

### 13. Add Instructions to Avoid Common Issues

**The Insight**: LLMs sometimes add things you don't want. Be explicit about what NOT to do.

**Examples of useful negative instructions:**
```
- Don't add suppression files unless absolutely necessary
- Don't add markdown files for explanation
- Don't add unnecessary comments
- Don't add tests that just verify implementation details
```

**Why this matters**:  
LLMs often try to be "helpful" by adding extra documentation or comments. If you don't want that, say so explicitly.

## Real-World Results: What Works

These insights come from teams using LLM agents in production on real projects. Here's what they found:

### ✅ High-Quality PR Example

**Scenario**: Implementing a feature where the surrounding code was predictable and well-structured.

**What they did:**
- Provided clear task description with examples
- Referenced existing similar implementations
- Had consistent patterns in the codebase
- Used linters to enforce conventions

**Result**: Most changes were correct in the first iteration. Only minor adjustments needed for merge conflicts.

**Key lesson**: Predictable code + good requirements = high-quality PRs.

### ❌ Common Pitfall: Vague Requirements

**Scenario**: Task description said "improve error handling" without specifics.

**What happened:**  
LLM made assumptions about error handling strategy that didn't match the team's conventions. Required multiple rounds of revision.

**Key lesson**: Be specific about what "good" looks like. Provide examples.

### ✅ Effective Use of Reference Files

**Scenario**: Team needed to add similar test files across multiple components.

**What they did:**
- Created one high-quality test file
- Told LLM: "Create tests for ComponentB following the exact pattern in ComponentA tests"

**Result**: Generated tests matched the style, structure, and quality of the reference file.

**Key lesson**: One good example > detailed written instructions.

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
3. ✅ Add instructions to work item templates to avoid common issues

**Most important**: Start with the area of your codebase that changes most frequently. That's where you'll see the biggest return on investment.

## Hacks and Tricks from the Field

### Use Branch Naming Conventions

Set up branch aliases like `dev/$assigningUserAlias/copilot` to make it clear which changes were AI-generated. This helps with traceability and lets you track patterns in what works and what doesn't.

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

## Common Mistakes to Avoid

### ❌ Mistake 1: Treating LLMs Like Magic

LLMs are tools, not magic. They work best when guided with clear requirements and good patterns.

**Instead**: Provide context, examples, and constraints just like you would for a new team member.

### ❌ Mistake 2: Inconsistent Patterns

Having different patterns in different parts of the codebase confuses LLMs (and humans).

**Instead**: Pick conventions and enforce them everywhere. Use linters to make consistency automatic.

### ❌ Mistake 3: No Feedback Loop

Accepting whatever the LLM generates without reviewing reinforces bad patterns.

**Instead**: Review LLM-generated code, learn what prompts work well, and refine your approach.

### ❌ Mistake 4: Trying to Fix Everything at Once

Rewriting your entire codebase to be "LLM friendly" is overwhelming and unnecessary.

**Instead**: Focus on the files that change most frequently. Fix those first, then expand gradually.

### ❌ Mistake 5: Over-Engineering

Creating elaborate documentation systems that require constant maintenance adds overhead without value.

**Instead**: Start simple. Add documentation and structure as needed based on actual pain points.

## Testing Your LLM-Friendliness

How do you know if your codebase is LLM-friendly? Try these experiments:

### Test 1: The Pattern Replication Test

Give the LLM a task: "Add a new endpoint for /api/products following the same pattern as /api/users"

✅ **Good sign**: The generated code matches your conventions, error handling, and structure  
❌ **Bad sign**: The code looks different from your existing endpoints

### Test 2: The Test Generation Test

Ask the LLM: "Add tests for the ProductService following the pattern in UserServiceTests"

✅ **Good sign**: Tests match your testing style and use the same helpers  
❌ **Bad sign**: Tests use different patterns or libraries

### Test 3: The Requirement Understanding Test

Give a task with minimal details and see what assumptions the LLM makes.

✅ **Good sign**: Assumptions align with your documented conventions  
❌ **Bad sign**: Assumptions conflict with your patterns (means your patterns aren't clear enough)

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

Start with one thing this week. Pick the practice that addresses your biggest pain point. Next week, pick another. Over time, you'll build a codebase that's a joy to work with, whether the developer is sitting at a desk or running in a data center.

**Remember**: The goal is code that clearly communicates its intent to anyone (or anything) reading it. That's always been the goal of good software engineering. LLMs just give us more motivation to finally do it right.

---

*Have questions or suggestions? The principles in this post come from real teams using LLM agents in production. If you've found other practices that work well, I'd love to hear about them.*
