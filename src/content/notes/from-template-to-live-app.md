---
title: From Template to Live App
description: The earlier post described the App Factory machine. This one is the machine actually running — one command, ten minutes, a live app.
date: 2026-06-01
lang: en
tags: ["platform-engineering", "terraform", "github-actions", "aws"]
---

So far, [App Factory](/notes/app-factory) has been a machine: a project name goes in, the infrastructure for that project comes out.

This post adds one improvement. Once the infrastructure exists, the same machine can keep going and create the frontend and backend repositories on top of it.

## One command

Running App Factory against all three templates is a single workflow dispatch:

```bash
gh workflow run add-project.yml \
  -f project=pet-store \
  -f iac_template_repo=bp-iac-reactjs-nestjs-dev \
  -f frontend_template_repo=react-vite-app \
  -f backend_template_repo=nestjs-app
```

That's it. The chain runs for about ten minutes.

## The chain, step by step

The command triggers a chain that runs in three phases.

First, the infrastructure phase — the part the earlier post described. App Factory provisions the AWS resources for the project and writes their identifiers (role ARNs, bucket names, instance ID) to a handoff document in S3:

```json
{
  "instance_id": "i-0123456789abcdef0",
  "instance_public_ip": "xxx.xxx.xxx.xxx",
  "artifact_bucket_name": "acme-corp-pet-store-deploys",
  "frontend_role_arn": "arn:aws:iam::...:role/GitHubActions-pet-store-frontend",
  "backend_role_arn": "arn:aws:iam::...:role/GitHubActions-pet-store-backend",
  "project": "pet-store",
  "organization": "acme-corp",
  "aws_region": "us-east-1"
}
```

Then the backend phase. App Factory forks the backend repository from its template, reads the handoff document, plugs everything the backend needs to know about the infrastructure into its secrets and variables, and runs its first deploy:

```bash
aws s3 cp "s3://.../artifacts/pet-store/outputs.json" outputs.json
BACKEND_ROLE_ARN=$(jq -r '.backend_role_arn' outputs.json)
INSTANCE_ID=$(jq -r '.instance_id'        outputs.json)

gh secret   set BACKEND_ROLE_ARN --repo "$REPO" --body "$BACKEND_ROLE_ARN"
gh variable set INSTANCE_ID      --repo "$REPO" --body "$INSTANCE_ID"
```

Backend goes first so that by the time the frontend is up, the API its login form will hit is already running.

Then the same for the frontend — fork the repository, read the handoff document, set the secrets and variables, run the first deploy.

Each phase waits for the previous via `gh run watch --exit-status`. If anything fails — Terraform, a build, a deploy — the chain stops there. Nothing downstream runs.

## The handoff document

The piece that ties it all together is `outputs.json`. It's just a JSON blob the infrastructure phase writes to S3 after Terraform's outputs are known. The backend and frontend phases read it back, pluck out the values they need, and configure their repositories.

Nothing about backend or frontend creation is hard-coded in App Factory. They just know how to read a handoff document.

## CI/CD comes pre-wired

Each new repo isn't just code — it ships with a deploy workflow already configured. Push to `main` and the deploy runs on its own: build, package, ship to the right place, restart whatever needs restarting.

App Factory set up the secrets and variables before the first commit ever happened. There's no "now go set up CI/CD" step left on the list. From the moment the repo exists, every push goes through the same path the first deploy did.

From `gh workflow run` to a login screen in the browser, there's no manual step in between.

## Learning by doing

From day one I knew the orchestrator wasn't finished at v1. The question was what the new pieces would turn out to be.

Permissions were one. Each new template wanted them slightly different — extending the defaults was easy, but projects already provisioned stayed frozen at whatever the defaults looked like when they were created.

So a second layer grew around the orchestrator, for existing projects — ways to replace a whole policy set, or add and remove a single statement surgically. Each tool came from hitting the same friction twice and deciding to make the third time a one-liner.

The job isn't to anticipate every workflow up front. It's to notice friction and make the next one cheap.
