---  
layout: post
unique_id: LLM-05
title: "Measuring LLM Capability and Reliability: Pass@k vs Pass^k"
subtitle: Two similar-looking metrics answer very different questions about model performance.
tldr: LLM evaluations often run the same task multiple times. Pass@k asks whether any of k attempts succeeds, while Pass^k asks whether every attempt succeeds. Together, they separate what a model can do from how consistently it can do it.
permalink: /p/pass-at-k-vs-pass-to-the-k
author: srungta
cover: /assets/images/LLM/LLM-05/cover.svg
image: /assets/images/LLM/LLM-05/cover.png
tags:
  - LLM
  - Evaluation
  - Reliability
  - Benchmarks

series:
  id: LLM
  index: 5

featured: true
isNew: true
mermaid: true
---

## The truth about working with LLMs

Ask an LLM the same question several times and you may get several different answers. One response might be correct, another subtly wrong, and a third unusable. That variation is a normal part of sampling from a language model.  

This might be okay when you are getting started. But at some point , you must start asking the hard questions.  
How much can you trust your model?  
Will your model actually get to an answer?  
Can you reliably run the agent automation and expect it to the right thing?  

All these questions imply the need of a mental model to check how good is your model/agent performace. This bring us to `pass@k` and `passˆk` scores.  

In its simplest form, for an agent that repeats a task `k` times,  
**pass@k** asks: Did at least one of the `k` attempts succeed?    
**pass^k** asks: Did every one of the `k` attempts succeed?  

- `pass@k` measures **capability**. Can repeated sampling uncover a correct answer?  
- `pass^k` measures **reliability**. Can the model produce a correct answer consistently?  

{% capture core_insight %}  
Pass@K and PassˆK must **NOT** be the only metrics you use for evals.    
These are only introductory heuristics.  
{% endcapture %}  
{% include highlight.html type="error" title="🚨 Super important point 🚨" content=core_insight %}  

## Lets take an example.  

Lets say you gave a coding model some problem to solve.  
The first answer you got fails the tests. The second one does not compile. The third one handles the happy path but forgets that empty arrays exist. The fourth answer works.  

Will you say that the model successfully completed the task?  
If you are exploring what the model **can** do, the answer is yes. It found a valid solution. However if this model is running an unattended production workflow, the answer is a nervous no. Three out of four runs failed is not a production friendly metric. 🥵  

`Pass`metrcis answer these two differnt questions.     
In our case of 4 answers,    
`pass@4` records the one working answer and says the model demonstrated the capability.     
`pass^4` records the three failures and says the model was not reliable across all four attempts.  

## Pass@k  

`pass@k` measures the probability that **at least one** of `k` attempts is correct.  
For k = 1 (`pass@1`), the model gets one attempt. Either it works or it does not.  
For k = 10 (`pass@10`), the model gets ten attempts. Nine can fail spectacularly. If one passes, the task counts as a success.  

This may sounf very simple but is quite useful. It tells you whether the model has the solution somewhere inside its distribution. If you have tests, a verifier, a human reviewer, or another system that can select the good answer, then generating several candidates is a legitimate way to get output.  

It is also why `pass@k` rises as `k` grows. More attempts create more opportunities to get lucky. A models chance of getting an answer right once across 1000 attempts is obviously greater than 10 attempts.  

Mathematically, it is easy to express this score.  
Assume one attempt has probability `p` of succeeding and each attempt is independent.  
The chance that any given attempt fails is `(1 - p)`  
The chance that all `k` attempts fail is `(1 - p)^k`, so  
The chance that at least 1 attempt passed becomes 1 - (1 - p)^k  

```text
pass@k = 1 - (1 - p)^k
```

If a model succeeds 70% of the time:  

```text
pass@1 = 70%
pass@3 = 1 - (1 - 0.70)^3 = 97.3%
```

That looks excellent. Give the model three attempts and it will produce at least one correct answer 97.3% of the time.  

⚠️ Someone still has to identify which answer is correct.  

> `pass@k` quietly assumes there is a selection mechanism after generation. A test suite can do that for code. A symbolic checker can do it for maths. A human can do it for a draft. Without a reliable judge, ten answers may just give you ten confidently written things to inspect.  

## Pass^k

`pass^k` asks the opposite question: what is the probability that **all** `k` attempts are correct?  

Under the same independent-attempt assumption:  

```text
pass^k = p^k
```

For the same model with a 70% single-attempt success rate:  

```text
pass^1 = 70%
pass^3 = 0.70^3 = 34.3%
```

Same model. Same task. Same three attempts.  

- `pass@3` says **97.3%**  
- `pass^3` says **34.3%**  

That is not a rounding error. That is a completely different story.  

`pass@3` tells us the model is highly capable when retries and selection are available.  
`pass^3` tells us that only about one-third of three-run groups are flawless. If every run can send  
an email, modify a database, approve a refund, or merge code, that distinction matters a lot.  

```mermaid
flowchart TB
  Task["One task"] --> AtK["pass@k"]
  Task --> PowerK["pass^k"]

  AtK --> Candidates["Generate k candidates"]
  Candidates --> A1["Fail"]
  Candidates --> A2["Pass"]
  Candidates --> A3["Fail"]
  A1 --> Select{"Verifier or reviewer"}
  A2 --> Select
  A3 --> Select
  Select -->|"At least one passes"| Winner["Task passes"]

  PowerK --> Runs["Run the task k times"]
  Runs --> R1["Pass"]
  Runs --> R2["Pass"]
  Runs --> R3["Pass"]
  R1 --> All{"Do all runs pass?"}
  R2 --> All
  R3 --> All
  All -->|"Only if every run passes"| Reliable["Task passes"]

  classDef source fill:#eef3f8,stroke:#52687a,color:#172b3a,stroke-width:2px
  classDef capability fill:#e8f1fb,stroke:#2463a2,color:#102a43,stroke-width:2px
  classDef reliability fill:#e6f4ea,stroke:#287d3c,color:#163d22,stroke-width:2px
  classDef failure fill:#fce8e6,stroke:#b4473a,color:#5f2019

  class Task source
  class AtK,Candidates,A2,Select,Winner capability
  class PowerK,Runs,R1,R2,R3,All,Reliable reliability
  class A1,A3 failure
```

## Correlation between the two metrics

For an imperfect model, increasing `k` makes the metrics separate:  

| Metric | What must happen? | As `k` grows | Useful when |
| --- | --- | --- | --- |
| `pass@k` | At least one attempt succeeds | Goes up | You can retry and select a winner |
| `pass^k` | Every attempt succeeds | Goes down | Every run must be dependable |

For a model with a 70% single-attempt success rate, the separation looks like this:  

```mermaid
xychart-beta
  title "Same model, more attempts"
  x-axis "k attempts" [1, 2, 3, 4, 5]
  y-axis "Probability (%)" 0 --> 100
  line "pass@k" [70, 91, 97.3, 99.2, 99.8]
  line "pass^k" [70, 49, 34.3, 24, 16.8]
```

This creates a fun benchmark trick.  

If a model has a 20% chance of solving a difficult problem in one attempt, its `pass@1` is only 20%. But its theoretical `pass@20` is about 98.8%.  

The model obvoisly did not suddenly become five times smarter. Search, retries, and verification are real system components. The mistake is presenting `pass@20` as if it describes the experience of a user who asks once and accepts the first answer.  

## But how do I already know the success rate?

The previous formulas assume we already know the model's true success probability `p`. In an evaluation, we do not know it. We generate samples and estimate it.  

Suppose we setup a benchmark that generates:  

- `n` total answers for one problem
- out of that `c` are correct answers
- we want to evaluate groups of `k` answers

The standard estimator introduced with [HumanEval][HumanEval paper] and used by its [reference implementation][HumanEval implementation] for `pass@k` is:

```text
pass@k = 1 - C(n - c, k) / C(n, k)
```

`C(a, b)` means "the number of ways to choose `b` items from `a` items."

> The fraction calculates how many groups of `k` contain only failures. Subtracting it from 1 gives the fraction containing **at least one success**.

The matching estimator for `pass^k` is:

```text
pass^k = C(c, k) / C(n, k)
```

> Here we count only groups where all `k` selected answers come from the correct answers.  

If you are like me and have trouble parsing permutations and combinations, the below example should clarify the maths.  
For example, imagine we generated 10 answers and 7 out of 10 passed:  

```text
n = 10
c = 7
k = 3

pass@3 = 1 - C(3, 3) / C(10, 3)
     = 119 / 120
     = 99.2%

pass^3 = C(7, 3) / C(10, 3)
     = 35 / 120
     = 29.2%
```

The numbers differ slightly from the earlier 97.3% and 34.3% because this calculation operates on the ten samples we actually observed, without replacement. The earlier calculation assumed an underlying 70% success probability and independent attempts.  

## Pass@k may feel inflated but is quite useful

It is tempting to look at the gap and declare `pass@k` a misleading metric.  

However, `pass@k` is excellent at measuring **coverage**:  

- Can the model solve this problem at all?
- Does sampling reveal atleast one correct reasoning path?
- If I have a verifier-backed system, can I find a good candidate?
- Does the model produce diverse solutions rather than repeating one mistake?

For a coding assistant, this can match reality. Generate several implementations, run tests, and show the developer the one that passes. The retries are then part of the product.  

> "The model gets 95% on pass@10" does not mean "the model is correct 95% of the time." It means that, under that benchmark's prompt, sampling settings, tests, and candidate count, at least one of ten generated answers passed for 95% of tasks.  

That is valuable information.   

## When pass^k matters

`pass^k` becomes important as we move from **augmentation** to **automation**. This distinction also appears in recent [agent reliability research][agent reliability]: We as humans are okay with some inconsistency in augmentation tools. However autonomous systems turn unreliable output directly into unreliable action.  

With augmentation, a human remains in the loop:  

- A developer reviews generated code
- An analyst checks a generated query
- A writer edits a generated draft
- An operator approves the proposed action

One bad attempt is inconvenient. The humans are the safeguard.  

With automation, the output becomes the action:  

- The agent changes production configuration
- The workflow sends messages to customers
- The system updates financial records
- The bot closes incidents or deletes resources

Now one bad attempt can bring down production systems.  

There is also a componding problem. An agent that succeeds nine times out of ten may sound production-ready. But when we run it through a 20-step workflow where every step must succeed, and the probability of a flawless run is:  

```text
0.9^20 = 12.2%
```

This is why long agent workflows feel more fragile than their individual demos. Small failure rates compound.  

```mermaid
flowchart LR
  Start[Start workflow<br/>100%] --> S1[Step 1 passes<br/>90%]
  S1 --> S5[Five steps pass<br/>59%]
  S5 --> S10[Ten steps pass<br/>35%]
  S10 --> S20[Twenty steps pass<br/>12.2%]

  classDef start fill:#eef3f8,stroke:#52687a,color:#172b3a,stroke-width:2px
  classDef early fill:#e6f4ea,stroke:#287d3c,color:#163d22,stroke-width:2px
  classDef middle fill:#fff3cd,stroke:#9a6700,color:#4d3500,stroke-width:2px
  classDef late fill:#fce8e6,stroke:#b4473a,color:#5f2019,stroke-width:2px

  class Start start
  class S1 early
  class S5,S10 middle
  class S20 late
```

## What should you report?

There is no single perfect number. Report the metric that matches how the system will be used.  

### Report pass@1

This is the clean baseline. What happens when the user asks once and accepts one answer?  

### Report pass@k when retries are expected and part of the system

Use it when your actual system generates `k` candidates and has a credible way to select one:  

- Tests
- A formal verifier
- A deterministic constraint checker
- A human reviewer
- A separately evaluated reranker

Do not report `pass@100` for a product that only generates one answer.  

### Report pass^k when consistency matters

Use it when repeated runs should remain correct, or when a sequence contains several opportunities for failure. For examples, agent workflow chaining, regression testing, safety-sensitive actions, and workflows without a human backstop.  

### Why not report both!

The gap between the metrics is itself useful.  
At `k = 1`, they are the same measurement. As `k` grows, they reveal different properties.  

- High `pass@k`, low `pass^k`: capable but inconsistent  
- Low `pass@k`, low `pass^k`: the task is beyond the model  
- High `pass@k`, high `pass^k`: capable and dependable  

That tells a much richer story than any one of them.  

## A few traps before you calculate either

### Attempts are not always independent

Models can repeat the same reasoning pattern, especially at low temperature. Agent runs may share the same retrieved documents, tools, cached state, or environmental failure. The simple `p` formulas are intuition, not a guarantee that real runs behave independently.  

### Correctness is only as good as the judge

A code sample "passes" because it passed the available tests. Missing tests can turn a wrong answer into a benchmark success. A non reliable evaluator can mess up your evalutions.  

### Sampling settings are part of the metric

Temperature, prompts, tool access, token limits, and model versions all change the result. Comparing two `pass@k` numbers with different evaluation setups is not a clean model comparison.  

### Reliability has more than one dimension

`pass^k` captures repeated correctness. It does not measure calibration, safety, robustness to prompt changes, recovery from tool failures, or behavior under a changing environment.  

## Key takeaways

1. **`pass@k` measures capability** - at least one of `k` attempts must succeed.
2. **`pass^k` measures consistency** - all `k` attempts must succeed.
3. **More retries make `pass@k` rise** - capability becomes easier to discover.
4. **More required successes make `pass^k` fall** - unreliability compounds.
5. **Retries need a judge** - multiple candidates help only if you can identify the good one.
6. **Automation raises the bar** - a human can absorb inconsistency; an unattended workflow cannot.
7. **Report both when trust matters** - one tells you what the model can do, the other how often you can depend on it.

## Conclusions.

If you are building a demo, exploring the edge of model capability, or using a strong verifier, `pass@k` is exactly the question you want to ask.  

If you are giving an agent tools, permissions, and the ability to act without approval, ask the other question too:  

> It succeeded once. Will it succeed again?

## References

- [Evaluating Large Language Models Trained on Code][HumanEval paper] - the HumanEval paper that introduced the `pass@k` estimator.
- [OpenAI HumanEval `pass@k` implementation][HumanEval implementation] - the reference code for the unbiased estimator used above.
- [Towards a Science of AI Agent Reliability][agent reliability] - recent work on why consistency matters as models move from augmentation to automation.

[HumanEval paper]: https://arxiv.org/abs/2107.03374 "Evaluating Large Language Models Trained on Code"
[HumanEval implementation]: https://github.com/openai/human-eval/blob/master/human_eval/evaluation.py "OpenAI HumanEval pass@k implementation"
[agent reliability]: https://arxiv.org/abs/2602.16666 "Towards a Science of AI Agent Reliability"
