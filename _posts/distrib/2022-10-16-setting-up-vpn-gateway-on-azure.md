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
Go to the azure portal and create a new virtual network. You can follow the instructions at [Microsoft Docs](https://docs.microsoft.com/en-us/azure/virtual-network/quick-create-portal#create-a-virtual-network) or look at the GIF below. 


![Creating a virtual network](/assets/images/distrib/DISTRIB02/create-a-virtual-network.gif)

1. Select **Create a resource** in the upper left-hand corner of the portal.
1. In the search box, enter **Virtual Network**. Select **Virtual Network** in the search results.
1. In the **Virtual Network** page, select **Create**.
1. In **Create virtual network**, enter or select this information in the **Basics** tab:

    | Setting | Value |
    | ------- | ----- |
    | **Project details** |   |
    | Subscription | Select your subscription. |
    | Resource group | Select **Create new**. Enter **Demo**. Select **OK**. |
    | **Instance details** |   |
    | Name | Enter **demo-vn**. |
    | Region | Select **(US) East US**. |

1. If you look at the GIF, we had created a subnet called `workers`. We will keep our worker nodes in that subnet for cleaner isolation.
I have used `10.1.1.0/24` as the subnet mask.
1. We wont be adding a Bastion host as we want to login via the VPN.

#### 2. Add 2 worker VMs to this network.
Now that we have a network, we will add two small VMs to this network. 
If you look at the GIF, we had created a subnet called `workers`. We will keep our worker nodes in that subnet for cleaner isolation.

You can follow the steps at [Microsoft Docs](https://docs.microsoft.com/en-us/azure/virtual-network/quick-create-portal#create-virtual-machines) or follow the GIF below.


![Creating worker VMs](/assets/images/distrib/DISTRIB02/create-a-worker-vm.gif)

We intentionally do not assign a public ip and nsg to the VM because we dont want it accessible from the outer public internet.
The idea is that all traffic that comes to these worker should be from within the network.

Similar create one more VM called `worker-2`.


#### 3. Setup a Virtual network Gateway

Next we create a VPN Gateway for this network.
The docs at [Microsoft Docs](https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-howto-point-to-site-resource-manager-portal) are pretty exhaustive. So follow that.
 
I used these settings.

![Creating gateway](/assets/images/distrib/DISTRIB02/demo-vn-gateway-create.png)

> Creating a gateway can often take 45 minutes or more, depending on the selected gateway SKU.

#### 4. Check if you can login into your VMs.
Once you are connected to the VPN, let us validate if you can access the worker VMS.
If everything is okat you should be able to ssh into the VMs using their private IP on the network.
You can find this in the `overview` tab of the VM details on Azure.

Next open a `bash` terminal and 

Fin.
