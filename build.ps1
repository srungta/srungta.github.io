# Bootstrap the project
# docker run --rm -v ${PWD}/blog:/srv/jekyll/blog jekyll/jekyll:latest jekyll new . 

# Run the site
# docker run -v ${PWD}:/srv/jekyll -p 4000:4000 -it jekyll/jekyll:latest jekyll serve

# Run the site without refresh
docker run --rm -v ${PWD}:/srv/jekyll -p 4000:4000 -e JEKYLL_ENV=production -it jekyll/jekyll:latest jekyll serve --force_polling 