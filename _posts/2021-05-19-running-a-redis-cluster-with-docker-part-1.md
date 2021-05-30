---
layout: post
title: Redis cluster with docker - Part 1
permalink: /redis/redis-cluster-with-docker-part-1
author: srungta
tags: 
- Redis
- Docker
- Systems
---

#### Intent behind this blogpost
I am trying to understand distributed systems from its basic building blocks. First step I picked up in the process was to setup a cache cluster.
Redis is one of the most popular distributed cache solutions. So we start here.

#### Why use docker?
- The simpler reason is because I dont want to install any dependencies on my system.
- Docker also gives a completely reproducible environment, which mean whatever you read here, you will be able to reproduce exactly.

#### Pre requisites
- A windows or a linux system with internet.
- Docker Engine. (You can find installation instructions [on the official site](https://docs.docker.com/engine/install/))

#### What we will try to achieve in part 1
- Setup up a redis standalone instance in cluster mode
- Setup multiple redis standalone instances in cluster mode
- Create a local network
- Join all standalone instance as a cluster
- Understand how the cluster works
Bonus:
- Have some automation scripts for parts of the steps.
- Test scripts to interact with redis.

#### Disclaimers
I am on a Windows machine so I will be using Powershell for most of my work. 
BUt the same commands should work fine on Linux systems as well.

#### Steps
1. Open a Powershell window and run 
{% highlight powershell %}
docker -v
{% endhighlight %}

For me this prints `Docker version 20.10.5, build 55c4c88`

2. Next we need to pull the redis image from the public docker registry.  
{% highlight powershell %}
docker pull redis
{% endhighlight %}

At this point if you get an error saying
```
error during connect: This error may indicate that the docker daemon is not running.: Get http://%2F%2F.%2Fpipe%2Fdocker_engine/v1.24/containers/json: open //./pipe/docker_engine: The system cannot find the file specified.
```
it means your docker service is running. Start that first.
If everything is fine, you should multiple lines of logs with a progress bar next to each line. Let the download complete.

3. Once the download completes check if the image is available on your system.
```powershell
docker images
```  
This should should a list of images present in your system. You should see an entry for redis.

4. As a quick check, start a new insatnce of the redis image and check if it is working as expected.
{% highlight powershell %}
docker run --rm --name test-redis-instance redis
{% endhighlight %}

#### Future scope
- Setup the redis cluster on a cloud VM. (to understand cloud environments)
- Setup a cluster across two VMs. (to understand networking in cloud environment)

#### References
This post build heavily on the [cluster tutorial on redis site](https://redis.io/topics/cluster-tutorial). I would highly recommend reading that as it explains the inner working of the cluster much better than I can.
Other similar posts that helped are as follows:
- [https://www.dltlabs.com/blog/how-to-setup-configure-a-redis-cluster-easily-573120](https://www.dltlabs.com/blog/how-to-setup-configure-a-redis-cluster-easily-573120)
- [https://medium.com/commencis/creating-redis-cluster-using-docker-67f65545796d](https://medium.com/commencis/creating-redis-cluster-using-docker-67f65545796d)