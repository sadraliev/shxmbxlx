---
title: "How NambaTaxi Lost Kyrgyzstan to Yandex Go"
description: "The Bishkek taxi war wasn't decided by technology. It was decided by who chose the driver — a shift from a pull to a push distribution model."
date: 2026-07-10
lang: en
draft: false
tags: ["essay", "kyrgyz republic"]
---


## It Wasn't About Technology

In 2018, NambaTaxi was the leader of the taxi market in Kyrgyzstan.

The company had everything: a mobile app, a call center, and, most importantly, a large fleet of its own drivers.

Most customers ordered a taxi by sending their address in an SMS or by calling the dispatcher. About five minutes later, a driver would arrive. Sometimes, instead, they received a message saying:

*"There are no available drivers in your area. Please try again later."*

Only a small number of customers used the mobile app. It existed, but it was not the main way people ordered taxis.

That same year, Yandex Taxi entered the market with an aggressive marketing campaign. Cheap prices. Promo codes. Ads everywhere. Every month it took a bigger share of the market.

Local taxi companies started losing customers. Orders became less frequent.

Yandex Go had only one customer channel: the mobile app. It had no call center and no SMS ordering.

So the answer seemed obvious.

The app was the secret.

That is exactly what local companies believed. They rushed to improve their own apps. They added new features for drivers and passengers, polished the user experience, and copied Yandex Go.

They kept losing.

The real difference was not the app. It was what happened after the customer pressed the **"Order"** button.

When we use a taxi service, we are not buying a ride.

We are buying a promise that a driver will arrive in **N** minutes.

That promise is the real currency of the platform. The customer pays with money, and the platform pays with its word.

The company that keeps its promise more reliably wins.

Yandex Go and NambaTaxi kept that promise in very different ways.

To explain the difference, I'll use two simple terms: **PULL** and **PUSH**. They describe two completely different ways of assigning rides.

Before looking at the systems, imagine this thought experiment.

Suppose there are two taxi services.

The first uses a futuristic brain chip. You think about taking a ride, and the chip sends the request automatically.

A driver accepts it.

Five minutes later, the driver cancels.

Another driver accepts it.

Then that driver cancels too.

Sometimes a car arrives after 10–20 minutes. Sometimes no one comes at all.

The second service uses a carrier pigeon.

You write your address on a piece of paper, tie it to the bird, and let it fly away.

But five minutes later, your driver is waiting outside.

Which service would you use every week?

The answer is obvious.

## The PULL Model and Its Side Effects

Inside NambaTaxi, every order followed the same path.

It could come from four different channels: the call center, SMS, the website, or the mobile app.

Every request included only two things: the pickup location and the service class.

After that, all requests went into one shared queue. Inside the company, this queue was called **The Boiler**.

Every driver currently working could see every new order in real time.

The first driver to press **Accept** got the ride.

This is a **PULL model**.

Drivers pull orders from a shared pool. The platform simply publishes them.

This design created three predictable problems.

Each one became a real pain for customers.

### 1. Drivers picked the most profitable rides

Drivers chose rides based on price instead of distance.

A premium ride could be accepted by someone on the other side of the city simply because they wanted premium fares.

Meanwhile, nearby economy rides waited.

**Customer problem:** long waiting times because the driver had to cross half the city.

### 2. Canceling was almost free

A driver could accept an order, start driving toward the customer, notice a better ride in the shared queue, and switch to it.

**Customer problem:** your driver accepts the ride—and suddenly cancels. You have to start over.

### 3. The platform gave its promise to the drivers

The platform only collected requests and published them in the shared queue.

Everything after that depended on individual drivers.

Who wanted the order?

Who changed their mind?

Who canceled?

Who ignored it?

In practice, NambaTaxi handed over its promise to the drivers.

**Customer problem:** service quality depended more on random driver behavior than on the platform itself.

The platform had trapped itself.

It could not improve the most important part of the product—the matching system—because the platform was not really controlling it.

## The PUSH Model

Uber introduced a different approach several years earlier.

Later, Yandex Go adopted the same idea.

In the **PUSH model**, the platform chooses the best driver itself.

It considers distance, driver quality, availability, and many other signals.

Then it sends the order to one driver.

The driver can still refuse.

But refusing now has a cost: lower ratings, lower priority, or financial penalties.

With this one architectural decision, all three problems of the PULL model become much smaller.

**Cherry-picking disappears.**

Drivers no longer see every available ride.

They only see the one assigned to them.

There is nothing to compare.

**Cheap cancellations disappear.**

Drivers cannot switch to a better ride because they never see another one.

If they cancel, there are consequences.

**Waiting in the queue disappears.**

The platform assigns a driver immediately instead of publishing the request and hoping that someone accepts it.

---

Local taxi companies copied the Yandex Go app because they believed the product was the app.

It wasn't.

The real product was the ability to keep a promise.

The matching system was simply the machine that made that promise reliable.
