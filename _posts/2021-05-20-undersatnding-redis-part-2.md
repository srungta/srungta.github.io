---
layout: post

title: Understanding Redis - Part 2
subtitle: Running Redis locally using Docker
tldr: Run a standalone redis instance using Docker.
permalink: /redis/understanding-redis-part-2
author: srungta
tags: 
- Redis
- Docker
- Systems

series: 
  name:  Understanding Redis
  index: 2
---

In this part, we will try to run a redis standalone instance on your local machine.
Typically you can install Redis using its official tar.gz releases.
You can download it from [its official site](https://redis.io/download) or follow the instructions [in this blog post](https://divyanshushekhar.com/how-to-install-redis-on-windows-10/) to run it on Windows.
I will be using Docker images from redis for this post.

> If you are not sure what Docker is, you should [read this article](https://medium.com/@SaadAAkash/docker-for-dummies-literally-ab3fc6362d5f).

### Why use docker?
- The simpler reason is because I dont want to install any dependencies on my system.
- Docker also gives a completely reproducible environment, which mean whatever you read here, you will be able to reproduce exactly.


### Pre requisites
- A windows or a linux system with internet.
- Docker Engine. (You can find installation instructions [on the official site](https://docs.docker.com/engine/install/))

> I am on a Windows machine so I will be using Powershell for most of my work. But the same commands should work fine on Linux systems as well.

### Steps

#### Validate docker 
Open a Powershell window and run 
{% highlight powershell %}
docker -v
{% endhighlight %}
For me this prints `Docker version 20.10.5, build 55c4c88`
At this point if you get an error saying
```
error during connect: This error may indicate that the docker daemon is not running.: Get http://%2F%2F.%2Fpipe%2Fdocker_engine/v1.24/containers/json: open //./pipe/docker_engine: The system cannot find the file specified.
```
it means your docker service is running. Start that first.

#### Get the Redis image 
 Next we need to pull the redis image from the public docker registry.  
{% highlight powershell %}
docker pull redis
{% endhighlight %}
This will pull the latest redis image from the docker public registry.
If everything is fine, you should see multiple lines of logs with a progress bar next to each line. Let the download complete.

#### Validate image
Once the download completes check if the image is available on your system.
```powershell
docker images
```  
This should should a list of images present in your system. You should see an entry for redis.

#### Run an instance 
As a quick check, start a new insatnce of the redis image and check if it is working as expected.
{% highlight powershell %}
docker run --rm --name test-redis-instance redis
{% endhighlight %}
This should print a long alphanumeric hash on your console. That is your container id.
Breakdown of the command  

| Priority apples       | Second priority                                                             |
|-----------------------|-----------------------------------------------------------------------------|
| `docker`              | base command                                                                |
| `run`                 | starts a container                                                          |
| `--rm`                | Removes the container automatically when it is stopped                      |
| `--name`              | Specifies the name of the container. If unspecified a random name is given. |
| `test-redis-instance` | Name of our container                                                       |
| `redis`               | Name of the image to use                                                    |

Run `docker ps` to see the running containers. You should see an entry for test-redis-instance.

We now have redis running on our system.
In the next part we will see how we can execute commands against this redis instance to get keys and set values.