## fediship-port

This is a monorepo of support packages for the [fediship](https://github.com/sterlingwes/fediship) repo I'm working on (a mobile app for fediverse / ActivityPub services like Mastodon).

### errors-ui

This is an error report viewer frontend that allows for keeping an eye on user error reports. One of the goals of fediship is to be privacy-first, so that includes avoiding integrating error reporting SDKs that often track a lot of client-related metadata. It's deployed using Cloudflare Pages.

### errors-api

The backend API supporting errors-ui and exposing a reporting endpoint for the fediship app. It's deployed using Cloudflare Workers and backed by Cloudflare R2 and KV for storage.

### api-common

A package with common functions and utilities for other packages in this repo that run backend code.

### scripts

CLI scripts for interacting with Cloudflare's API and pulling data down.

### workers

Initial API worker drafts and an attempt at a cron worker that fetched instance stats from the fediverse.
