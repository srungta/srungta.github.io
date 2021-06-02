---
layout: post

title: Understanding Redis - Part 1
subtitle: Introduction to Redis
tldr: Introduces redis as a distributed key value store using analogies.
permalink: /blog/redis/understanding-redis-part-1
author: srungta
tags: 
- Redis
- Systems

series: 
  name:  Understanding Redis
  index: 1
---

#### What is Redis?
Redis is a caching software. What this means is that it helps you keep values in main memory instead of disk, so that you can access them quickly.

For example, when you write a program like 
{% highlight cpp %}
...
public static void main(){
    int key = "value";
    cout << key;
}
{% endhighlight %}

you are keeping the value of the variable `key` in memory and later using it, in this case for printing on the standard output.
If you have a large number of such `key`s, you might use a dictionary or hashmap like structure.

{% highlight cpp %}
#include <map>
std::map<char, char> my_map = {
    { 'key1', '1' },
    { 'key2', '2' },
    { 'key3', '3' }
};
{% endhighlight %}

and later to get the value of `key1`, you may do something like
{% highlight cpp %}
...
if(my_map.find("key1") != my_map.end())
        std::cout<<"word 'key1' found"<<std::endl;
...
{% endhighlight %}

However you will realise that this type of in memory key management is limited to a single program.

Now suppose you have two programs `A.cpp` and `B.cpp` who want to access the same key `key1`'s value.
There are different ways of doing this.
1. You write the value of `key1` in an external file. Both `A` and `B` can read this file and get the value. However this value is no longer in memory and has to be read from disk which is generally slow.
2. Through some low level magic code, you access `A`'s address space and read `key1` in `B`. This is ridiculous and might not even be possible. 
3.  You maintain `key1`'s value in an external service/program `C` and both `A` and `B` ask `C` for this value.  

Point 3 is seen in many systems. All databases, Web APIs, RPCs etc are forms of the program `C` for their clients.
Redis is similarly a type of `C`, an external program that maintains the values that are needed by the client programs `A` and `B`.

> Usually programs like `C` are called `servers` and programs like `A` and `B` are called `clients`.

The speciality of Redis is that it maintains these values in memory so the retrival of these values is really quick.
[In contrast to a SQL like system which may have to do a disk read to get the value]

Programs like Redis that maintain a key to value mappings are usually called `key-value stores` 

#### What makes Redis an important key value store?
1. Redis makes it super fast to get the `value` when you know the `key`.( because values are kept in memory )
2. Multiple programs can access the value of keys without knowing about each other. (They just need to know the redis server program )
3. Redis is a **distributed key value store.**  
Let us take an example to understand what this means.  
In our previous example, we were maintaining a map of keys to values.  
Let us say your key is a 20 character long string which has the name of a person, and your value is a 480 character long string which has the address and other details of that person.  
If we consider one character as 1 byte, for each person you need **~500 bytes** of memeory.  
The population of Zaire is around **80 million people**.  
Let us say you want to store the name and address of all 80 million people in Zaire.   
That means you need a total space of 500 * 80,000,000 bytes of memory, which is **~40 GB** of memory.  
Now to hold all this data in the memory in one computer is possible but is expensive.  
For that you need a machine which has a RAM > 40 GB.  
Tomorrow if you have to also keep the details about the 10 million people in Israel, you will have to add ~5Gb memory to your machine. Imagine how much RAM you will need if you wanted to store the data for all 8 billion people in the world.  
What redis lets you do is store this data on multiple machines.  
So instead of having one big machine with 40 GB memory, you can have 10 smaller machines with 4GB memory or 40 smaller machine with 1GB memory.  
So when your data size grows you can keep adding smaller machines instead of increasing the memory space of one machine.  
Thus your key value store becomes *distributed* across multiple machines.
Redis manages which keys are stored on which machine.

> This set of machines form a `Redis Cluster`.  
> One bonus advantage is that your clients need not care about all the 40 (or whatever number) machines in this *cluster*.
They just need to know at least one. In the back ground Redis can take care of getting the data from correct machine.  
> We will explore this distributed nature further in this series when we have a cluster up and running.

4. Redis clusters can be **fault tolerant.**  
From the example in 3., now let is say you were running a cluster with 40 machines. This means each machine will have data for about 2 million people. For some unknown reason, let us say one of these machines `goes down` (meaning it becomes undiscoverable, or restarts, or loses internet connectivity, or there is an OS error, or the systems hangs, or the machine overheats and shuts down or there is a lighting strike). In this case the data of about 2 million people is now gone. (⓿_⓿)  
This is usually bad.  
To avoid such scenarios, large scale systems like yours, do not keep a single a single copy of data. They `replicate` the data on multiple machines.  
This is like you keeping your important documents on an external harddrive, as well as keeping a copy of it on GDrive, one on Dropbox, one on OneDrive and one physical xerox in your cupboard.  
So that if one is lost the others can be used.  
Similarly data is also replicated between multiple machines, so that if one goes down the other can be used.  
Redis lets you do this also as part of its cluster formations.  
So you can say that , "Hey I have 40 machine and 40 GB of data. Instead of keeping 1 GB of data per machine. Keep 2GB of data on each machine. Use the first 20 machines as the primary ones. Use the second set of 20 machines as backup if one of the machines in first set goes down."  
Now even if all 20 machines of the primary set go down, your cluster is still available to clients.   
> Fault tolerance : if one or more of the parts in the system is faulty, the system can continue to operate upto some extent. 

In the next part let us try running the Redis software and see how it works.
