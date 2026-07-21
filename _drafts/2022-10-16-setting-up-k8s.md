---
layout: post
unique_id: K8S-01

title: Setting up a 2 node Kubernetes cluster
subtitle: Create a  2 node k8s cluster using Azure VMs.
tldr: Set up the k8s control plane and worker node on azure VMs from scratch.
permalink: /p/setup-2-node-k8s-cluster
author: srungta
tags: 
- Kubernetes
- K8S

series: 
  id: K8S
  index: 1
---

What is Kubernetes?
#### Create servers
FOllow the instructions in [this post]({% post_url ../DISTRIB/2022-10-16-DISTRIB-setting-up-vpn-gateway-on-azure %}) to create a virtual network with 2 VMs.  
I am using these names for the VMs.  
`sr-k8s-node-1`  
`sr-k8s-node-2`  
Then connect to the VPN so that you can access the VMs for installation.

#### Configure servers for Kubernetes
#### Set up Master node
#### Set up Worker nodes
#### Deploy pod network
#### Quick test
#### Testing Scaling and Self-healing