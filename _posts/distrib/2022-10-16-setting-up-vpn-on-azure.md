---
layout: post
unique_id: DISTRIB02

title: Setting up a VPN Gateway on Azure
subtitle: Create a virtual network with multiple VMs and connect to them via a VPN gateway.
tldr: VPNs are an excellent way to connect to proiate network of machines that you don't want to expose to the public internet.
permalink: /blog/distrib/setting-up-azure-vpn-gateway
author: srungta
tags: 
- Azure
- VPN
isNew: true

series: 
  id: DISTRIB
  index: 2
---

#### What is virtual private network?
- A `network` is just a group of machines that can talk to (discover) each other.
- A `private network` usually means that the network is not accessible from public internet. Only the machines that are inside the network, can see other machines inside the network.
For everyone else, it is as if these machines and network do not exist.
- A `virtual private network gateway` lets you access the private network without compromising its security. In some way, your machine behaves as if you are part of this network by presenting some sort of credentials.

A very crude corollary of a VPN would be a secretive underground nightclub that lets you enter only if you know the pre determined secret code.
There are people inside who can talk to each other [aka `network`]. For everyone else outside the club, it almost does not exist [aka `private network`].
If you happen to know how to find the club [aka `VPN gateway`] and know the correct secret password [aka `credentials`], you are allowed to enter.

#### Why VPN?
The one major goal of it is security. Traditionally if you have a remote VM that you want to access, you will usually use an `SSH` or an `RDP` connection by using the VM's public IP. On the public internet, both of these are not considered secure. You can read more opinions at [This SO answer](https://security.stackexchange.com/questions/236603/is-it-safe-to-expose-port-22-on-a-database-vm)
A VPN lets you connect to the VMs in your network without the VMs having a public IP.

#### Where to get VMs?
You can use any of the cloud providers, AWS, Azure, Google CLoud etc.  
They each have some sort of free or trial program.  
For this post we will be using Azure VMs.

#### What we will be doing?
- We will setup a virtual network with two Ubuntu VMs.
- We will NOT assign any public IPs to the VMs.
- We will confgure and connect to the machine by setting up VPN for the network.

#### How will we do this?
This will be the general sequence of steps.

- We setup a virtual network. 
- Add 2 VMs to this network.
- Add a VPN Gateway. 
- Connect from windows using a VPN client.

Lets unpack this a bit and do this one by one.

#### 1. Setup a Virtual network
Go to the azure portal and create a new virtual network. You can follow the instructions at https://docs.microsoft.com/en-us/azure/virtual-network/quick-create-portal#create-a-virtual-network or look at the GIF below. 


![Creating a virtual network](/assets/images/distrib/DISTRIB02/create-a-virtual-network.gif)

We wont be adding a Bastion host as we want to login via the VPN.

#### 2. Add 2 worker VMs to this network.
Now that we have a network, we will add two small VMs to this network. 
If you look at the GIF, we had created a subnet called `workers`. We will keep our worker nodes in that subnet for cleaner isolation.

You can follow the steps at https://docs.microsoft.com/en-us/azure/virtual-network/quick-create-portal#create-virtual-machines or follow the GIF below.


![Creating worker VMs](/assets/images/distrib/DISTRIB02/create-a-worker-vm.gif)

We intentionally do not assign a public ip and nsg to the VM because we dont want it accessible from the outer public internet.
The idea is that all traffic that comes to these worker should be from within the network.

Similar create one more VM called `worker-2`.


#### 3. Setup a Virtual network Gateway

Next we create a VPN Gateway for this network.

![Creating a virtual network gateway](/assets/images/distrib/DISTRIB02/create-a-virtual-network-gateway.gif)


#### 4. Connect from your device.

Till now most of the ehavy lifting has been done by Azure. Now comes the important part. How do we actually connect to this VPN Gateway.
The simplest way to do that is using certificates. Certificates are akin to secrets that you can present while trying to access the network.
In this demo, we will create a self signed certificate and use that.

> DONOT use self signed certificate in production. Use authority signed certificates that are signed correctly and can be verified for their integrity.


#### 4.1. Create a root certificate and a child certificate.
The basic idea is that we create a root certificate and add the public key of the certificate to our gateway.
Then we create child certificates using this root certificate that will be installed on all machines that want to connect to the VPN.


#### 4.2. Export the public key of root certificate and add to gateway.
#### 4.3. Install the child certificate.
#### 4.4. COnnect to VPN.

#### 5. Check if you can login into your VMs.


Fin.
