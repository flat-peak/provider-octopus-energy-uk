# Octopus Energy UK Integration

FlatPeak integraiton with Octopus Energy UK using [Node.JS](<https://nodejs.dev/>) hosted at [Fly.io](https://fly.io) with deployment via GitHub Actions.

## Install tools

Tools used to develop this project.

- [Node](https://nodejs.dev)
- [Flyctl](https://fly.io/docs/flyctl/installing/)

```
go install golang.org/x/tools/cmd/goimports@latest
```

## Running locally

- Clone this repository
- Run `npm login` to login to npm and access the private `@flatpeak/api-service` package
- Run `npm install`
- Run `npm start`
- copy `.env.blank` to `.env` and set correct details

##  One-offs:

Create Fly App:

`fly launch --no-deploy --org flatpeak --name [app name]`

Currently:
staging - stg-octopus-providers-fp
production - prod-octopus-providers-fp

Add SSL certificates:
<https://fly.io/docs/app-guides/custom-domains-with-fly/>

## Deployment with GitHub Actions

- Set repository action secrets for:

`FLY_API_TOKEN` - get it by running `flyctl auth token`.
`NPM_TOKEN` - get it from FlatPeak npmjs account.

- Commit to either `staging` or `production`.
