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
If you look at the top and bottom of a post you should see something like



## Conclusion

Integrating GitHub Issues into your Jekyll site is a simple yet powerful way to collect and manage user feedback, without a service overhead.
