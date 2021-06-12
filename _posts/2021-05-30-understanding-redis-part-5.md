---
layout: post

title: Monitoring Redis with Graphana
tldr: Monitoring Redis with Graphana, an open source visualization tool.
permalink: /blog/redis/monitoring-redis-with-graphana
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

**DISCLAIMER:**  
**This is a long-ish post as it also covers some aspects of docker networking and docker compose**  

While using the cli to get these values is handy, getting these metrics one by one, or getting them for a number of machines, or for a cluster is quite annoying. you will usually find some or the other visualization software to see these values as graphs. These tools also help us see time based trends.  
We will use [Graphana](https://grafana.com/) for this post, which is free and has redis connectors available.
Also **Graphana** has Docker images available. 😊 So we will use that.


#### Get the Graphana image 
Lets first pull the Graphana image from the public docker registry.  
{%- highlight powershell -%}
docker pull graphana/graphana
{%- endhighlight -%}

You can find more about different docker images for Graphana [on their official site](https://grafana.com/docs/grafana/latest/installation/docker/)

#### Run the Graphana image 
Run an instance of graphana using this command.
{%- highlight powershell -%}
docker run -d -p 3000:3000 grafana/grafana
{%- endhighlight -%}
Once the container starts, go to [http://localhost:3000/](http://localhost:3000/) to see the grafana dashboard.
The default username and password is `admin`.
![Graphana admin login screen](/assets/images/redis/graphana-login.png)

#### Add the Redis connector plugin
Grafana does not ship with a Redis connector by default. However their is a community plugin that is useful. [More details on the official site](https://grafana.com/grafana/plugins/redis-datasource/)
The plugin can be installed by passing an argument to the `docker run` command.
The graphana image exposes a build argument called `GF_INSTALL_PLUGINS` which can be used to install the plugin at runtime.
The below plugin does it.
{%- highlight powershell -%}
docker run -d -p 3000:3000 --name grafana -e "GF_INSTALL_PLUGINS=redis-datasource" grafana/grafana
{%- endhighlight -%}

#### Validate the Redis connector is present
Go to [http://localhost:3000/datasources](http://localhost:3000/datasources).

You should see a `Add data source` button like below.
![Graphana add data source](/assets/images/redis/graphana-add-data-source.png)

Search for `redis` in the search bar
![Graphana search Redis](/assets/images/redis/graphana-redis-data-source.png)

You should see a connector like shown in the image above.

#### A short note on docker networking
Before we connect to our redis instance, a short note on how docker networks work.
Docker containers are very isolated from their hosts, unless you configure them to behave differently.

So if you just write `docker run -d grafana/grafana` instead of `docker run -d -p 3000:3000 grafana/grafana`, you wont be able to see the graphana UI, even though inside the container graphana ui code is still running.
When we specify `-p` or `--port` parameter, it tell docker to map the container port number to the host port number.
That way, when we say `-p 3000:3000`, dockers maps port 3000 of host system (your computer) to the port `3000` of the container. So when you open the [http://locahost:3000](http://locahost:3000) link in the browser, the request is routed to the container's port `3000` and you get the response.

#### Connecting redis instance to graphana
Open [http://localhost:3000/datasources](http://localhost:3000/datasources) and search for redis again.
Select the redis connector and fill in `http://localhost:6379` (our redis instance's port) in the address field and click `Save & Test`.
![Graphana Redis localhost](/assets/images/redis/graphana-redis-localhost.png)

Lets understand the error by analysing the sequence of events.
- Graphana code is running inside the container.
- You map the container port to host port 3000 so that you can see the UI.
- In the connector form, you enter `http://localhost:6379` as your redis address.
- The graphana code inside the container get a message that redis is located at `http://localhost:6379`.
- Graphana code inside the container tries to connect to redis on port `6379` in its localhost (inside the container , not on your system)
- Graphana code does not find a redis instance on its own local 6379 port and gives the error.

This means that even if you exposed your redis instance's port to your host machine using 
`docker run --rm -p 6379:6379/TCP --name test-redis-instance redis`, it still wont work. I tried. It didn't.

I was also a bit confused at this point.
After reading the [docker networking tutorial here](https://docs.docker.com/network/network-tutorial-standalone/) and [explanation of bridge networks here](https://docs.docker.com/network/network-tutorial-standalone/), here is a way to do it.


#### Connecting redis instance to graphana [The hard way]
So we first have to locate the redis instance from the viewpoint of the graphana container.
Since redis is not running inside the graphana container, it means both containers should be connected by some network.
By default standalone containers connect to a docker network called `bridge`. This network acts as a liason between the host and docker containers. (Helps move traffic, forward request, return data etc.). We just need to find the IP of the redis instance in the `bridge` network.
To do that, open another powershell window and run 
{%- highlight powershell -%}
docker network inspect bridge
{%- endhighlight -%}
This prints a JSON.
Look for a section called `Containers`.
{%- highlight json -%}
...
"Containers": {
    "71df1fb060baeb221cb01b78e3c60717934fa...": {
        "Name": "test-redis-instance",
        "EndpointID": "cefcf5c80fed007b...",
        "MacAddress": "....",
        "IPv4Address": "172.17.0.3/16",
        "IPv6Address": ""
    },
    "d22e95f9ee297e66839d93b9e41afdd367169...": {
        "Name": "grafana",
        "EndpointID": "e56d45454e56562a...",
        "MacAddress": "....",
        "IPv4Address": "172.17.0.4/16",
        "IPv6Address": ""
    }
}
...
{%- endhighlight -%}
Copy the `IPv4Address` for the `test-redis-instance` container. In my case it is `172.17.0.3`.
Now in the graphana UI, use this IP along with the port 6379, as the address of the redis instance `172.17.0.3:6379`
![Graphana redis IP](/assets/images/redis/graphana-redis-ip.png)


#### Connecting redis instance to graphana [The easy way]
Finding the IP addresses like this is annoying and error prone.
Docker has something called [Docker Compose](https://docs.docker.com/compose/) that lets use write multi container docker applications nicely.
TO do this create a 
