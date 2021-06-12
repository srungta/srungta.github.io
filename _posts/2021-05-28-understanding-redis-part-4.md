---
layout: post

title: Tracking Redis Metrics using INFO
tldr: Tracking Redis metrics using Redis INFO command.
permalink: /blog/redis/tracking-redis-metrics-using-info
author: srungta
tags: 
- Redis
- Docker
- Systems

series: 
  name:  Understanding Redis
  index: 4
---

In the last part we started a local Redis instance and added some keys using the Redis CLI. However whenever we deploy any caching system it is useful to track how well the cache is doing, whether it performing well, what is the read time, write time etc.

#### What metrics will we target to get?
In this post, we will try to get the cache hit values.
Cache hit/miss numbers helps us understand how many times the key we looked up was present in the cache.
A high cache hit rate means the cache is being used better. Our ideal cahce hit rate is 100% (we get all the values in the cache). However it is usually hard to get it in production because your cache size is usually less than your key space (Eg: You can only store names of 100 people at max, but there are a total of 100 people, so inevitably someone's name will not be in the cache at the moment.)
A high miss rate means we are probably not caching the most used values. In this case, we should have a deeper look at what are the values that are getting cached and what are the values that are being queried.
[From our past example of people information, if you have the person's first name as key, but you are looking up values based on person's last name, you will have a high miss rate. Analysis of cache hit/miss also helps us find these logical bugs.]

#### Connect to a Redis instance
As always we will start a redis instance. You can use the exec command to connect to it.
{%- highlight powershell -%}
docker run --rm --name test-redis-instance redis
docker exec -it test-redis-instance /bin/bash
{%- endhighlight -%}
{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> 
{%- endhighlight -%}


#### Using Redis's INFO commands
Redis CLI provides inbuilt commands to get the statistics for the redis instances and clusters.
Lets us set and get some values first, so that we have some info to look at.
{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> SET K1 V1
OK
127.0.0.1:6379> SET K2 V2
OK
127.0.0.1:6379> SET K3 V3
OK
127.0.0.1:6379> GET K1
"V1"
127.0.0.1:6379> GET K2
"V2"
127.0.0.1:6379> GET K2
"V2"
127.0.0.1:6379> GET K3
"V3"
127.0.0.1:6379> GET K3
"V3"
127.0.0.1:6379> GET K5
(nil)
127.0.0.1:6379> GET K6
(nil)
127.0.0.1:6379> GET K7
(nil)
{%- endhighlight -%}

First let us manually get some numbers.
We added 3 keys. So  
`KEYS_IN_CACHE = 3`  
We made a total of 8 `GET` requests.
Out of these, 5 returned the values present in the cache. So  
`CACHE_HITS = 5`  
The other 3 keys that were queries were not in the cache. So  
`CACHE_MISSES = 3`  
With these values, our cache hit rate is   
`CACHE_HIT_RATE = CACHE_HITS/(CACHE_HITS+CACHE_MISSES) = 5/(5+3) = 5/8 = 62.5%`  
`CACHE_MISS_RATE = CACHE_MISSES/(CACHE_HITS+CACHE_MISSES) = 3/(5+3) = 3/8 = 37.5%`  

Now lets get these values from `INFO` command.
You can read more about the command in the [officiual reference doc](https://redis.io/commands/INFO#:~:text=The%20INFO%20command%20returns%20information,clients%20%3A%20Client%20connections%20section)
In the same cli type 
{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> INFO STATS
# Stats
total_connections_received:6
total_commands_processed:10217
...
expired_keys:0
evicted_keys:0
keyspace_hits:5
keyspace_misses:3
...
{%- endhighlight -%}
You will see a lot of values coming up. You can find their descriptions in the [officiual reference doc](https://redis.io/commands/INFO#:~:text=The%20INFO%20command%20returns%20information,clients%20%3A%20Client%20connections%20section)

The `keyspace_hits` is the cache hit value that we talked about earlier and the `keyspace_misses` is the cache miss values.

To get the number of keys in the cache there is another command called `INFO KEYSPACE`
{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> INFO KEYSPACE
# Keyspace
db0:keys=3,expires=0,avg_ttl=0
{%- endhighlight -%}
The `db0:keys` is the number of keys in the cache.

Go ahead and give the other `INFO` commands [listed on the Redis CLI reference here](https://redis.io/commands)
