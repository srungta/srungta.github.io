---
layout: post
unique_id: REDIS3

title: Using the Redis CLI
tldr: Connecting to a Redis instance using CLI
permalink: /blog/redis/using-the-redis-cli
author: srungta
tags: 
- Redis
- Docker
- Systems

series: 
  name:  Understanding Redis
  index: 3
---

In the last part we started a local Redis instance, but we did not talk about how to actually get or add a key to the cache.
In this part, we will try to do that.

#### Run an instance 
As a quick check, lets start a new instance of the redis image.
{%- highlight powershell -%}
docker run --rm --name test-redis-instance redis
{%- endhighlight -%}
This should print a long alphanumeric hash on your console. That is your container id.

#### Connect to the container bash
`docker` container are just vm-like environments running in an isolated environment. That means these instances can have other programs bundled inside them.  
For instance the redis image is build on top of a linus distro and has the bash cli in it.  
We can connect to the bash and execute commands using the `redis-cli` that comes with Redis.
You can read more about redis-cli commands [on the official site](https://redis.io/topics/rediscli) 

Since we are running Redis inside docker we can use the `docker exec` command with `-it` (interactive) flag to connect to bash.
Open a powershell window and execute 
{%- highlight powershell -%}
docker exec -it test-redis-instance /bin/bash
{%- endhighlight -%}
You should see something like on your windows.
{%- highlight bash -%}
root@db0f535254e7:/data#
{%- endhighlight -%}
This is the bash cli inside the container.
You can try command bash commands like `ls`, `pwd` to see it working.


#### Running Redis CLI commands
In the prompt, type `redis-cli`.
{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379>
{%- endhighlight -%}
The `6379` is the port on which Redis program is currently listening. Since the redis instance is local to the docker container, you see the `127.0.0.1` host.

The basic test to connect to a redis instance to execute the `PING` command.
{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> 
{%- endhighlight -%}

A `PONG` message validates that your instance is working fine.
As you are tyPING any command in redis-cli, you should see suggestions and help test in gray coming up.


#### Setting a key value.
The next command is the most common use case for Redis. Setting a key and a value.
For this we will use the `SET` command.

{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> SET key value
OK
127.0.0.1:6379> 
{%- endhighlight -%}
The `OK` is a good sign. That means your value is set.

To get a value, we use the `GET` command.


{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> SET key value
OK
127.0.0.1:6379> GET key
"value"
127.0.0.1:6379> 
{%- endhighlight -%}

You can see the `"value"` being retrieved.
If you try to `GET` a key that does not exist, you get a `(nil)` value.

{%- highlight bash -%}
root@db0f535254e7:/data# redis-cli
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> SET key value
OK
127.0.0.1:6379> GET key
"value"
127.0.0.1:6379> GET key2
(nil)
127.0.0.1:6379>
{%- endhighlight -%}

Go ahead and try the other commands [listed on the Redis CLI reference here](https://redis.io/commands)
