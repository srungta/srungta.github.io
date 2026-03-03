---
layout: post
unique_id: JEKYLL01

title: Getting Feedback via GitHub Issues
subtitle: If your code and content are on GitHub, your feedback can be too.
tldr: Integrate creation of GitHub Issues directly with prefilled values from your Jekyll site.
permalink: /blog/jekyll/getting-feedback-via-github-issue
author: srungta
tags:
  - Jekyll
  - GitHub
  - Feedback

series:
  id: JEKYLL
  index: 1
---
* TOC
{:toc}

## Context

This site is built using Github Pages with a Jekyll template. Being a static site generator, Jekyll does not have an inbuilt way to get feedback. Typically you would show the users a form to fill feedback and then write a service that collects and saves this feedback. Later you would build a portal to see all these feedback items and categorize and track them. Or you would use a pre-built package/service to do this for you.
Instead I felt like using Github issues is a good candidate for collecting this feedback.

## Why Use GitHub Issues for Feedback?

I wanted to collect feedback on the posts on this website but did not want to integrate any external products. GitHub Issues provide a centralized and structured way to collect feedback for me. Also, having feedback on GitHub allows labeling and associating them with pull requests.

### Pros

- **Ease of use**: Readers can provide feedback with just a few clicks.
- **Centralized tracking**: All feedback is stored in one place on GitHub.
- **Actionable insights**: Use GitHub's features like labels, milestones, and assignees to manage feedback effectively.

### Cons

- **Github Login**: Readers needs a Github account to comment.

## How to Integrate GitHub Issues?

### How Does It Look?

Below this post, you will see a link to give feedback. It should look something like this:

<div class="centered-image-container">
  <img alt="Feedback Button Example" src ="/assets/images/jekyll/JEKYLL01/Feedback-Button-Example.png" class="centered-image" />
</div>

On clicking the feedback button, you should be navigated to Github and see a screen like below 👇

<div class="centered-image-container">
  <img alt="Feedback Example" src ="/assets/images/jekyll/JEKYLL01/Feedback-Example.png" class="centered-image" />
</div>

### Breaking Down the Feedback Link

GitHub provides a URL to create a new issue with prefilled values directly.  
For example, the GitHub URL for this page is [here](https://github.com/srungta/srungta.github.io/issues/new?labels=feedback&title=&body=%0A%0A%5BAdd%20details%20here%5D%0A%0A---%0A%23%23%23%23%20Document%20Details%0A%E2%9A%A0%20%2ADo%20not%20edit%20this%20section.%20It%20helps%20me%20track%20the%20feedback.%2A%0A%2A%20%2A%2APost%20link%2A%2A%20%3A%20/blog/jekyll/getting-feedback-via-github-issue%0A%2A%20%2A%2APost%20Id%2A%2A%20%3A%20JEKYLL01)

Breaking down the URL:

| URL Section                                    | Meaning                          |
| ---------------------------------------------- | -------------------------------- |
| `https://github.com/srungta/srungta.github.io` | Repository base URL              |
| `/issues/new`                                  | Fixed path to create a new issue |
| `?labels=feedback`                             | Adds a label to the issue        |
| `&title=`                                      | Adds a title (empty here)        |
| `&body=**url-encoded-body**`                   | Sets the body of the issue       |

### Adding It to Each Post

The main trick is to create the GitHub link. Everything else is regular Markdown and HTML.

1. I have a `unique_id` added to the front matter of each post. This can be accessed as `page.unique_id`.
2. Jekyll already lets you access `page.url`.  
   This site already uses a feedback button that links to GitHub Issues. Here's how it works:
3. So my URL becomes:  
   `https://github.com/srungta/srungta.github.io/issues/new?labels=feedback&title=&body=PageUrl-{{ page.url | relative_url }}___PageId-{{ page.unique_id }}`
   > Feel free to edit the body as per your needs.
4. Add a feedback button to your posts using the following HTML snippet:

```html
<div class="gh-feedback">
  <a href="::Link from step 3::">
    <button class="gh-feedback-button">❣ Give feedback about this post</button>
  </a>
</div>
```

5. **Bonus**: You can move this HTML to `_layout/github-feedback.html` and add `{ %- include github-feedback.html - % }` in your `post.html` layout page.

## Conclusion

Integrating GitHub Issues into your Jekyll site is a simple yet powerful way to collect and manage user feedback, without a service overhead.
