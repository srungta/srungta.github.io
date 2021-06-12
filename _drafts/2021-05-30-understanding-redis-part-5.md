---
layout: post

title: Visualizing Redis Metrics using Graphana
tldr: Visualizing Redis metrics using Graphana, an open source visualization tool.
permalink: /blog/redis/visualizing-redis-metrics-using-graphana
author: srungta
tags: 
- Redis
- Docker
- Systems
- Graphana

series: 
  name:  Understanding Redis
  index: 5
---

While using the cli to get these values is handy, getting these metrics one by one, or getting them for a number of machines, or for a cluster is quite annoying. you will usually find some or the other visualization software to see these values as graphs. These tools also help us see time based trends.  
We will use [Graphana](https://grafana.com/) for this post, which is free and has redis connectors available.
Also Graphana has Docker images available. 😊 So we will use that.

