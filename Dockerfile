# Use the minimal jekyll image
FROM jekyll/minimal:3.8
# Use the 3.9.0 version because Github pages uses it.
RUN ["gem", "install", "jekyll", "-v", "3.9.0"]
WORKDIR /app
COPY . ./
EXPOSE 4000
CMD ["jekyll", "serve"]