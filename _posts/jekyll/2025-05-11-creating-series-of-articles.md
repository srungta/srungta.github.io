---
layout: post
unique_id: JEKYLL01
title: Creating a Series of Articles In Jekyll
subtitle: Linked articles within a series should be easily navigable.
tldr: Easily group and link related blog posts in Jekyll using front matter and data files for sequential navigation.
permalink: /blog/jekyll/series-of-posts
author: srungta
tags:
  - Jekyll
  - GitHub
  - Series

series:
  id: JEKYLL
  index: 2
---
* TOC
{:toc}

## Context

This site is built using GitHub Pages with a Jekyll template. I wanted to write blog posts related to a specific topic under a series header. I also wanted to implement "Next" and "Previous" navigation for a more immersive reading experience. Liquid front matter allows us to achieve this nicely in Jekyll.

## Overall Idea

The way I've currently implemented this is by having a master data file for series metadata. Then, using Jekyll front matter, we can annotate posts with series IDs and use Liquid expressions to filter articles when displaying related posts.

### Setting up the Series Metadata

Jekyll supports data files that are available as built-in variables, allowing you to have virtually any valid data structure. So, we can do this:

1.  Add a file named `series.yml` in your `_data` folder.
2.  I use a simple setup like this:  
    ```yaml
      name: Series 1
      description: Description of Series 1
      id: SERIES_ID_1
    ```
3.  This data is now accessible on all pages as `site.data.series`, which is an array of objects.

### Attaching Posts to a Series

Once the series data is populated, we need to specify which posts belong to which series.

1.  Let's say `series-1-part-1.md` and `series-1-part-2.md` are Parts 1 and 2 of `Series 1` with the ID `SERIES_ID_1`.
2.  I use this syntax in the front matter of the posts:
    ```yaml
    series:
      id: SERIES_ID_1 # --- ID of the series from _data/series.yml
      index: 1 # --- Index of the post in the series
    ```
    ```yaml
    series:
      id: SERIES_ID_1 # --- ID of the series from _data/series.yml
      index: 2 # --- Index of the post in the series
    ```
    > The property `series` in the YAML above is not a reserved keyword. It's simply a string that we will use for matching later.

### Showing the Posts in Series Form on the Homepage

Now that we have created the series metadata and tagged the posts with the series information, we can start grouping them together.
If you visit [https://srungta.github.io/](https://srungta.github.io/) (this blog's homepage), you should see a list of posts grouped by series titles.
At the time of writing, the UI looks like this: 👇

<div class="centered-image-container">
  <img alt="Grouped posts" src ="/assets/images/jekyll/JEKYLL02/Grouped-Posts.png" class="centered-image" />
</div>

1.  In your `home.html`, you can add the following:
    ```html
    { %- if site.data.series.size > 0 - % }
      <section>
        { %- for series in site.data.series - % }
          { %- include series-details.html item=series - % }
        { %- endfor - % }
      </section>
    { %- endif - % }
    ```
    - Here, `site.data.series.size > 0` is a sanity check to ensure rendering only occurs when there is more than one series defined.
    - `{ %- for series in site.data.series - % }` iterates over the array of series objects in your data file.
    - `{ %- include series-details.html item=series - % }` passes the current `series` object from the loop to a layout file called `series-details.html`.

2.  In `series-details.html`, you now have access to the metadata of a single series through the `include` object.
    We can first display the details of the series itself for context:
    ```html
    <b>{ { include.item.name | escape } }</b> <!-- Name of series -->
    <p>{ { include.item.description } }</p> <!-- Name of series -->
    ```
    The `include.item` allows us to access the data passed to this layout in step 2.1.
    Now, let's display the list of posts within the series:
    ```html
    { %- assign seriesposts = site.posts | where: 'series.id', include.item.id | sort: 'series.index' - % }
    { %- if seriesposts.size > 0 - % }
    <ol>
      { %- for post in seriesposts - % }
      <li>
        <a href="{ { post.url | relative_url } }">"{ { post.title | escape } }"</a>
        { %- if post.tldr - % }
          <span class="sd-tldr">{ { post.tldr } }</span>
        { %- endif - % }
      </li>
      { %- endfor - % }
    </ol>
    { %- endif - % }
    ```
    - `assign seriesposts = site.posts | where: 'series.id', include.item.id | sort: 'series.index' ` is the core of the filtering logic. It selects all `site.posts` where the `series.id` (defined in the post's front matter) matches the `include.item.id` (the ID from `_data/series.yml`). Then, it sorts these posts based on the `series.index` (also defined in the post's front matter).
    - The rest of the code iterates through the filtered and sorted `seriesposts` to display their details.
    - You can access any property defined in the front matter of your posts, such as `post.tldr`, `post.url`, or any other custom property you might have.

### Showing the Previous and Next Links on the Post Page

If you look at the top and bottom of a post, you should see something like this: 👇
<div class="centered-image-container">
  <img alt="Previous Link posts" src ="/assets/images/jekyll/JEKYLL02/Previous-Link.png" class="centered-image" />
</div>
and
<div class="centered-image-container">
  <img alt="Next Link posts" src ="/assets/images/jekyll/JEKYLL02/Next-Link.png" class="centered-image" />
</div>

1.  First, we need to determine the previous and next posts for the current post. You can add the following code within your `_layouts\post.html`:
    ```html
    <!-- Back link to previous post in the series -->
    <!-- Check if this post is a part of a series. -->
    { %- if page.series - % }
      <!-- Collect all posts in this series -->
      { %- assign seriesposts = site.posts | where: 'series.id', page.series.id | sort: 'series.index' - % }

      { %- assign previouspostindex = page.series.index | minus: 1 - % }
      <!-- If there are more than one post -->
      { %- if seriesposts.size > 1 && previouspostindex > 0 - % }
      <!-- Find the post with index greater than this page-->
        { %- assign previousposts = seriesposts | where: 'series.index' ,previouspostindex - % }
        <!-- If a previous post is found, show a link -->
        { %- if previousposts.size > 0 - % }
          { %- assign previouspost = previousposts | first - % }
        { %- endif - % }
      { %- endif - % }

      { %- assign nextpostindex = page.series.index | plus: 1 - % }
      <!-- If there are more than one post -->
      { %- if seriesposts.size > 1 && nextpostindex > 0 - % }
        <!-- Find the post with index greater than this page-->
        { %- assign nextposts = seriesposts | where: 'series.index' ,nextpostindex - % }
        <!-- If a next post is found, show a link -->
        { %- if nextposts.size > 0 - % }
          { %- assign nextpost = nextposts | first - % }
        { %- endif - % }
      { %- endif - % }
    { %- endif - % }
    ```

2.  Now, within your `post.html` layout, you can use the `previouspost` and `nextpost` variables to display the links:
    ```html
       <!-- Backlink to previous post in the series -->
    { %- if previouspost - % }
    <div class="p-previous">
      <a href="{ { previouspost.url } }">&#x25c0; Previously, { { previouspost.title } }</a>
    </div>
    { %- endif - % }
    ```
    And at the end of your post.html:
    ```html
    { %- if page.series and nextpost - % }
    <div class="p-next">
      <a href="{ { nextpost.url } }">Next up, { { nextpost.title } }} &#x2192</a>
    </div>
    { %- endif - % }
    ```

## Pros and Cons of This Approach

1.  ✅ **PRO:** Series posts are automatically linked simply by setting the front matter.
2.  ✅ **PRO:** Adding a new series is straightforward; just add an entry to `_data\series.yml`.
3.  ✅ **PRO:** Series with no associated posts will not appear on the homepage.
4.  ✅ **PRO:** The first post in a series will not have a "Previous" link, and the last post will not have a "Next" link.
5.  ❌ **CON:** Ensuring the `index` of posts within a series is correctly ordered requires manual effort.

## Conclusion

Managing and displaying posts within a series in Jekyll is quite manageable through the use of front matter and Liquid expressions.