# Bootstrap the project
# docker run --rm -v ${PWD}/blog:/srv/jekyll/blog jekyll/minimal:3.8 jekyll new . 

# Run the site
# docker run -v ${PWD}:/srv/jekyll -p 4000:4000 -it jekyll/minimal:3.8 jekyll serve

# Run the site without refresh
docker run --rm -v ${PWD}:/srv/jekyll -p 4000:4000 -e JEKYLL_ENV=production -it jekyll/minimal:3.8 jekyll serve --force_polling 