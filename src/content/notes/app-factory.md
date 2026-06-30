---
title: App Factory
description: From manual setup to an automatic project factory — a one-person platform-engineering experiment built on Terraform, GitHub Actions, and AWS OIDC.
date: 2026-04-01
lang: en
tags: ["platform-engineering", "terraform", "aws", "github-actions"]
---

A few years ago, I worked for a software development outsourcing company. We built web applications for other companies.

We worked with different types of clients — from big companies like Johnson & Johnson to small startups. Most of them needed to turn an idea into a working product.

Basically, every project started the same way. I had to create the infrastructure: set up the server, configure hosting, container registry. Everything had to be done manually, step by step — sometimes literally click by click on the cloud provider console.
I also had to implement the same common features again and again, starting from configuring linters, formatters, branch strategy, to authentication, analytics, internationalization, payments integration, databases, observability, containerization, testing setup, and deployment pipelines.

At that time, I tried to automate this using CloudFormation, the GitHub API, and Bash scripts. It worked partly, but it was far from ideal. Some things were automated, but I never got the result I wanted.

Later, when I attended a cloud engineering and DevOps bootcamp, I discovered the concept of a [Repository Vending Machine](https://medium.com/akumosolutions-devops/repository-vending-machine-rvm-5bbfa25a908e) (RVM). That concept gave me a much better understanding of how to solve the problems properly.

> In larger orgs, this kind of work is the domain of a Platform Engineering team — they build internal platforms so that product engineers don't have to deal with infra plumbing. What I'm building here is a one-person, one-project version of the same idea.

The missing piece was combining a few ideas together.

First, Infrastructure as Code (IaC). It allowed me to describe infrastructure in code and create it in a repeatable way — especially Terraform with its declarative[^1] and idempotent[^2] approach.

Second, repository templates. A template is basically just a predefined project structure — an application boilerplate that can be reused to create a new project quickly.

Third, a small orchestrator. In my case, the orchestrator is responsible for the initial setup. It creates the project, prepares the required permissions, creates IAM roles, configures OIDC, and keeps track of what was created.

After that, each project can manage its own infrastructure through Terraform. The orchestrator does not do everything itself. It mainly bootstraps the project, manages permissions, and can also remove the project if needed.

Now, I'd like to walk through how my App Factory implementation evolved over time — from a simple proof of concept to a much more capable system.

## The Chicken-or-Egg Dilemma

My goal was simple: automatically create all the infrastructure required for a new application.

I wanted to use Terraform to create the infrastructure, GitHub Actions to run the automation, and OIDC to connect GitHub to AWS.

However, I quickly found a problem.

To run Terraform from GitHub Actions, GitHub needed permissions to access AWS.
To give GitHub these permissions, I had to create IAM roles and configure OIDC in AWS.

Terraform could create them, but Terraform needed access to AWS first.
So I had a loop:

- GitHub Actions needed AWS access to run Terraform.
- Terraform needed to run to create the AWS access.

To solve this, I decided to create a small one-time CloudFormation setup. It created only the basic resources needed to start using Terraform from GitHub Actions:

- `oidc.github.yml` — allowed AWS to trust tokens from GitHub.
- `oidc.role.yml` — created the IAM role that GitHub Actions could assume.
- `s3.state.yml` — created the S3 bucket for Terraform state.

After running these templates once, GitHub Actions had access to AWS, and Terraform had a place to store its state.

This solved the bootstrap problem and gave me a clean starting point for the rest of the automation.

## Handing Out IAM Roles

The next problem was simple: how to give each new project its own AWS identity and its own place to store Terraform state.

I solved it with one JSON file and a small Terraform configuration. The file is a list of projects; Terraform reads the list and creates one S3 bucket and one IAM role per project.

```hcl
# Read the project list from S3 and index it by name
locals {
  projects = {
    for p in jsondecode(data.aws_s3_object.projects.body).projects :
    p.name => p
  }
}

# For each project, create one state bucket and one IAM role
module "state_bucket" {
  source   = "./modules/s3"
  for_each = local.projects
}

module "iac_role" {
  source   = "./modules/iam-oidc-role"
  for_each = local.projects
}
```

Adding a project is one JSON edit. Removing one is the opposite. The code stays the same — only the data moves.

AWS has a name for this pattern: a Role Vending Machine. A central system that hands out IAM roles to other repositories with a standardized trust policy. I built mine without knowing the term, and later learned AWS had a published reference for the same idea.

This layer also owns one account-wide concern: **cost allocation tags**.

```hcl
resource "aws_ce_cost_allocation_tag" "project" {
  tag_key = "Project"
  status  = "Active"
}
```

One writer, one source of truth — and every project's cost ends up in the bill broken down by project name.

In practice, I run one GitHub Actions workflow with the project name as input:

```bash
gh workflow run add-project.yml \
  -f project=pet-store
```

The workflow updates `projects.json` in S3, runs Terraform, and out comes a new IAM role and state bucket for the project.

After a few runs, `projects.json` looks something like this:

```json
{
  "projects": [
    {
      "name": "pet-store",
      "organization": "acme-corp",
      "aws_region": "us-east-1"
    },
    {
      "name": "todo-app",
      "organization": "acme-corp",
      "aws_region": "us-east-1"
    }
  ]
}
```

## Handing Out Repositories

After the orchestrator runs, two pieces are in place: the S3 bucket for Terraform state, and the OIDC role for AWS access (see [The Chicken-or-Egg Dilemma](#the-chicken-or-egg-dilemma)).

Thanks to these, deploying infrastructure is now straightforward. Write some Terraform, push to a project repo, and the right AWS resources appear.

But what *should* appear depends on what kind of project it is. A web app needs one shape of infra; a self-hosted AI agent needs another. So I keep a **template repository** for each kind — a ready-made skeleton with the right Terraform already inside.

A few I use:

- `iac-template-react-nestjs` — full-stack web app on EC2, with RDS and S3.
- `iac-template-llm-agent` — EC2 + UserData + VPC + security groups, sized for Ollama or a self-hosted AI agent.
- `iac-template-static-site` — S3 + CloudFront for a blog or landing page.
- `iac-template-cron-lambda` — Lambda + EventBridge for a scheduled task.

When I add a project, I tell the orchestrator which template to use:

```bash
gh workflow run add-project.yml \
  -f project=pet-store \
  -f iac_template_repo=iac-template-react-nestjs
```

Inside the workflow, the orchestrator forks the template into a fresh repository:

```yaml
- name: Create project repo from template
  env:
    GH_TOKEN: ${{ secrets.GH_PAT }}
  run: |
    gh repo create acme-corp/pet-store-iac \
      --template acme-corp/iac-template-react-nestjs \
      --private
```

Then it fills in the project-specific bits — `backend.tf`, secrets, variables — and triggers the first deploy.

A new template is just a new GitHub repo. Make one, mark it as a template, and `add-project` can use it.

## Tearing It Down

The same orchestrator that creates a project can also take it apart. App Factory's `remove-project.yml` runs the chain in reverse, in two phases.

**Phase 1.** App Factory calls `destroy.yml` in the project's repo and waits for it to finish. The project tears down its own infrastructure using its iac role, while that role still has the permissions to do so.

**Phase 2.** App Factory removes the project from `projects.json` and runs Terraform against itself, dropping the state bucket and the iac role.

The order matters. If the iac role were dropped first, the project's destroy would have no permissions to run. So removal does what creation did, only reversed: the chicken-or-egg dilemma, played backwards.

[^1]: **Declarative** means you describe the result you want, not every step. Example: "I need one server" instead of "click here, then click there, then create a server manually."

[^2]: **Idempotent** means you can run the same command many times and get the same result. Example: If the server already exists, Terraform will not create a second one — it will just keep the existing server.
