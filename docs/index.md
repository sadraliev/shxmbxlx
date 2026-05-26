---
title: shxmbxlx
description: Notes on building, learning, and turning ideas into value.
aside: false
---
*Notes on building, learning, and turning ideas into value.*


# RVM
A few years ago, I worked  for a software development outsourcing company. We built web applications for other companies - we built software for other companies.
We worked with different types of clients - from big companies like Johnson & Johnson to small startups. Most of them needed to turn an idea into a working  product.

Basically, every project started the same way. I had to create the infrastructure:  set up the server, configure hosting, container registry. Everything had to be done manually, step by step - sometimes literally click by click on cloud provider console.
I also  had to implement  the same common features again and again,  start from configure linters, formatters, branch strategy  to authentication, analytics, internationalization, payments integration, databases,  observability, containerization,  testing setup, and deployment pipelines. 

At that time, I tried to automate this using CloudFormation, the Github API, and Bash scripts.
It worked partly,  but It was far from ideal. Some things were automated, but I never got the result I wanted.

Later, when I attended a cloud engineering and DevOps bootcamp, I discovered the concept of a Repository Vending Machine (RVM). That concept gave me a much better understanding of how to solve the problems properly.

The missing piece was combining a few ideas together.

First, Infrastructure as Code (IaC), It allowed me to describe infrastructure in code and create it in a repeatable way. especially Terraform with its declarative¹ and idempotent² approach.

Second, repository template. A template s basically just a predefined project structure - an application boilerplate that can be reused to create a new project quickly.

Third, a small orchestrator. In my case, the orchestrator is responsible for the initial setup. It creates the project, prepares the required permissions, creates IAM roles, configures OIDC, and keeps track of what was created.

After that, each project can manage its own infrastructure through Terraform. The orchestrator does not do everything itself. It mainly bootstraps the project, manages permissions, and can also remove the project if needed. 



_From Manual Setup to an Automatic Project Factory._

¹ Declarative means you describe the result you want, not every step. 
>Example: “I need one server” instead of “click here, then click there, then create a server manually.”

² Idempotent means you can run the same command many times and get the same result.
> Example: If the server already exists, Terraform will not create a second one. It will just keep the existing server.

