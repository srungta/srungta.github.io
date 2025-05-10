---
layout: post
unique_id: JEKYLL01

title: Creating a series of articles
subtitle: Linked articles from a series should be navigable easily.
tldr: Integrate creation of GitHub Issues directly with prefilled values from your Jekyll site.
permalink: /blog/jekyll/series-of-articles
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

This site is built using Github Pages with a Jekyll template. I wanted to write blog posts related to a specific topic under a series header. I also wanted to make some sort of "Next" and "Previous" functionality for immersive reading. Liquid front matter allows us to do this nicely in Jekyll.

## Overall Idea
The way I have added it currently is to have a master data file for series metadata. Then using Jekyll front matter, we can annotate posts with series ids and use liquid expressions to filters articles when showing related posts.  

### Setting up the series metadata.

Jekyll supports data files that are available as built in variables where you can technically have any valid data.
So we can do this.

1. Add a file called `series.yml` in your `_data` folder.
2. I use a simple setup like 
   ```yml   
    - name: Series 1
      description: Description of the series 1
      id: SERIES_ID_1
   ```
3. Now this data is available in all pages as `site.data.series` as an array of objects.

### Attaching posts to a series

Once we have the series data populated, we need to specify which posts are part of which series. 

1. Lets say `series-1-part-1.md` and `series-1-part-2.md` are Parts 1 and 2 of `Series 1`  with Id `SERIES_ID_1`
2. I use this syntax in the front matter of the posts
    ```yml
    series:
      id: SERIES_ID_1 # --- id of the series from _data/series.yml
      index: 1 # --- Index of the post in the series
    ```

    ```yml   
    series:
      id: SERIES_ID_1 # --- id of the series from _data/series.yml
      index: 2 # --- Index of the post in the series
    ```
    > The property `series` in above yaml is not a magic word. It is just a string that we will match later.

### Showing the posts in series form on homepage.

Now that we have created the series metadata and tagged the posts with the series info, we can start grouping them together.
If you go to https://srungta.github.io/ (this blog's homepage), you should see a list of posts grouped by series titles. 
At the time of writing the UI looks like this.👇

<div class="centered-image-container">
  <img alt="Grouped posts" src ="/assets/images/jekyll/JEKYLL02/Grouped-Posts.png" class="centered-image" />
</div>


1. In your `home.html`, you can add
   ```ruby
   {%- if site.data.series.size > 0 -%}
    <section>
      {%- for series in site.data.series -%}
      {%- include series-details.html item=series -%}
      {%- endfor -%}
    </section>
    {%- endif -%}
   ```

     - Here `site.data.series.size > 0` is a sanity check to only render when there are more than 1 series.
     -  `{%- for series in site.data.series -%}` iterates over the array of series objects.
     -  `{%- include series-details.html item=series -%}` passes the value of loop iterator `series` to a layout called `series-details.html`.

2. In `series-details.html` now we have access to the series metadata of one series.   
    We can first show the details of the series itself for context.
    ```html
    <b>{{ include.item.name | escape }}</b> <!-- Name of series -->
    <p>{{ include.item.description }}</p> <!-- Name of series -->
    ```
    The `include` object lets us refer to the data passed to this layout in step 2.2  
    Now lets show the list of posts under the series.
    ```ruby
    {%- assign seriesposts = site.posts | where: 'series.id', include.item.id | sort: 'series.index' -%}
    {%- if seriesposts.size > 0 -%}
    <ol>
        {%- for post in seriesposts -%}
        <li>
            <a href="{{ post.url | relative_url }}">"{{ post.title | escape }}"</a>
            {%- if post.tldr -%}
              <span class="sd-tldr">{{post.tldr}}</span>
            {%- endif -%}
        </li>
        {%- endfor -%}
    </ol>
    {%- endif -%}
    ```
   - `assign seriesposts = site.posts | where: 'series.id', include.item.id | sort: 'series.index' ` is the crux of the filtering.  We take all `site.posts` where `series.id` (that we set in the front matter of posts) is equal to the `include.item.id` (which is the id that comes from `_data/series.yml`). We thn sort using the `series.index` (that we set in front matter of posts)
   - Rest of the code is to loop over the posts and show their details.
   - We can use any property that is set in the front matter of the posts like `post.tldr` or `post.url` or `post.mycustomproperty`


### Showing the Previous and Next link on post page.
If you look at the top and bottom of a post you should see something like 👇
<!-- IMAGE -->


1. First we need to determine what are the previous and next posts for the current posts. We can add the below in `_layouts\post.html`
   ```html
    <!-- Back link to previous post in the series -->
    <!-- Check if this post is a part of a series. -->
    {%- if page.series -%}
      <!-- Collect all posts in this series -->
      {%- assign seriesposts = site.posts | where: 'series.id', page.series.id | sort: 'series.index' -%}

      {%- assign previouspostindex = page.series.index | minus: 1 -%}
      <!-- If there are more than one post -->
      {%- if seriesposts.size > 1 && previouspostindex > 0 -%}
      <!-- Find the post with index greater than this page-->
        {%- assign previousposts = seriesposts | where: 'series.index' ,previouspostindex -%}
        <!-- If a previous post is found, show a link -->
        {%- if previousposts.size > 0 -%}
          {%- assign previouspost = previousposts | first -%}
        {%- endif -%}
      {%- endif -%}

      {%- assign nextpostindex = page.series.index | plus: 1 -%}
      <!-- If there are more than one post -->
      {%- if seriesposts.size > 1 && nextpostindex > 0 -%}
        <!-- Find the post with index greater than this page-->
        {%- assign nextposts = seriesposts | where: 'series.index' ,nextpostindex -%}
        <!-- If a next post is found, show a link -->
        {%- if nextposts.size > 0 -%}
          {%- assign nextpost = nextposts | first -%}
        {%- endif -%}
      {%- endif -%}
    {%- endif -%}
   ```

   Now in your `post.html` you can use `previouspost` and `nextpost` to show the previous and next post.

    ```html
       <!-- Backlink to previous post in the series -->
    {%- if previouspost -%}
    <div class="p-previous">
      <a href="{{ previouspost.url }}">&#x25c0; Previously, {{previouspost.title }}</a>
    </div>
    {%- endif -%}
    ```

    and in the end

    ```html
    <!-- Backlink to next post in the series -->
    {%- if page.series and nextpost -%}
    <div class="p-next">
      <a href="{{ nextpost.url }}">Next up, {{nextpost.title }} &#x2192</a>
    </div>
    {%- endif -%}
    ```

## Pros and Cons of this approach
1. `✅ PRO` Series posts get autolinked just by setting front matter.
2. `✅ PRO` Adding a new series is easy. Just add to `_data\series.yml`
3. `✅ PRO` Empty series do not show up on the list.
4. `✅ PRO` First post in a series does not have previous link and last post does not have a next link.
5. `❌CON` Making sure that the index of posts in the series are properly ordered.


## Conclusion

Collating the posts under series can be managed easily in jekyll though some front end matter and liquid expressions.