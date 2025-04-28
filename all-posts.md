---
layout: page
title: All posts
permalink: /all-posts/
---

### Here are all the posts in reverse chronological order

<div class="home">
  <table>
    <thead>
      <tr>
        <td>Article</td>
        <td>Publish Date</td>
        <td>Tags</td>
        <td>What is it about?</td>
      </tr>
    </thead>
    <tbody>
    {% for post in site.posts %}
    <tr>
      <td>
        <a href="{{ post.url }}">{{ post.title }}</a>
      </td>
      <td style="width:96px">
        <time datetime="{{ post.date | date: " %Y-%m-%d" }}">{{ post.date | date_to_string  }}</time>
      </td>
      <td>
        {% for tag in post.tags %}
        <span class="p-tags-string">{{ tag }},</span>
        {% endfor %}
      </td>
      <td>{{ post.tldr }}</td>
    </tr>
    {% endfor %}
    </tbody>
  </table>
</div>