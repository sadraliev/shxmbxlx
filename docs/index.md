---
title: shxmbxlx
description: Notes on building, learning, and turning ideas into value.
aside: false
---
*Notes on building, learning, and turning ideas into value.*


# RVM
A few years ago, I worked  for a software development outsourcing company. We built web applications for other companies.

We worked with different types of clients - from big companies like Johnson & Johnson to small startups. Most of them needed to turn an idea into a working  product.

Basically, every project started the same way. 
I had to create the infrastructure:  set up the server, configure hosting, container registry. Everything had to be done manually, step by step - sometimes literally click by click on cloud provider console.
I also  had to implement  the same common features again and again,  start from configure linters, formatters, branch strategy  to authentication, analytics, internationalization, payments integration, databases,  observability, containerization,  testing setup, and deployment pipelines. 

At that time, I tried to automate this using CloudFormation, the Github API, and Bash scripts.
It worked partly,  but It was far from ideal. Some things were automated, but I never got the result I wanted.

Later, when I attended a cloud engineering and DevOps bootcamp, I discovered the concept of a Repository Vending Machine (RVM). That concept gave me a much better understanding of how to solve the problems properly.

The missing piece was combining a few ideas together.

First, Infrastructure as Code (IaC), It allowed me to describe infrastructure in code and create it in a repeatable way. especially Terraform with its declarative¹ and idempotent² approach.

Second, repository template. A template s basically just a predefined project structure - an application boilerplate that can be reused to create a new project quickly.

Third, a small orchestrator. In my case, the orchestrator is responsible for the initial setup. It creates the project, prepares the required permissions, creates IAM roles, configures OIDC, and keeps track of what was created.

After that, each project can manage its own infrastructure through Terraform. The orchestrator does not do everything itself. It mainly bootstraps the project, manages permissions, and can also remove the project if needed. 

Now, I'd like to walk through how my RVM implementation evolved over time - from a simple proof of concept to a much more capable system.

## The Chicken-or-Egg Dilemma
My goal was simple: Automatically create all the infrastructure required for a new application.

I wanted to use Terraform to create the infrastructure, Github Action to run the automation, and OIDC to connect GitHub to AWS. 

However, I quickly found a problem.

To run Terraform from Github Actions, Github needed permissions to access AWS.
To give GitHub this permissions, I had to create IAM roles and configure OIDC in AWS.

Terraform could create them, but Terraform needed access to AWS first. 
So I had a loop:
GitHub Actions needed AWS access to run Terraform.
Terraform needed to run to create the AWS access.

To solve this, I decided to create a small one-time CloudFormation setup.
It created only the basic resources needed to start using Terraform from GitHub Actions.
- `oidc.github.yml` - allowed AWS to trust tokens from GitHub.
- `oidc.role.yml` - created the IAM role that GitHub Actions could assume.
- `s3.state.yml` - created the S3 bucket for Terraform state.

After running these templates once, GitHub Actions had access to AWS, and Terraform had a place to store its state.

This solved the bootstrap problem and gave me a clean starting point for the rest the automation.

## Repository As Template
to be continue...


_From Manual Setup to an Automatic Project Factory._

¹ Declarative means you describe the result you want, not every step. 
>Example: “I need one server” instead of “click here, then click there, then create a server manually.”

² Idempotent means you can run the same command many times and get the same result.
> Example: If the server already exists, Terraform will not create a second one. It will just keep the existing server.

