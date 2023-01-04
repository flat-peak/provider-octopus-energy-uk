## Octopus Energy UK Integration

FlatPeak integraiton with Octopus Energy UK using [Node.JS](<https://nodejs.dev/>).

### Install tools

Tools used to develop this project.

- [Node](https://nodejs.dev)
- [Flyctl](https://fly.io/docs/flyctl/installing/)


### Run locally

- Clone this repository
- copy `.env.blank` to `.env` and set vars
- Run `npm login` to login to npm to access `@flatpeak/api-service` package
- Run `npm install`
- Run `npm start`

### Deploy to existing pipeline

Commit your code to either `staging` or `production` Github branches. Deployment will happen automatically via GitHub actions.


### Deploy a new app server

##### 1. Create new Fly App
fly launch --no-deploy --org flatpeak --name [app name]`

##### 2. Create new fly*.toml
clone or create new `.toml` file with your new app name.

##### 3. Create new github action .yml
use one of existing .github/workflows/fly-*.yml as a template.
<https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/>


##### 4. Add session secret
Specify a unique secret string for `SESSION_SECRET` variable

`flyctl secrets set -a [app_name] SESSION_SECRET=[secret]`

<https://fly.io/docs/reference/secrets/#setting-secrets>


##### 5. Add SSL certificates
<https://fly.io/docs/app-guides/custom-domains-with-fly/>

##### 6. Configure deployment via github actions

Set repository action secrets for:

`FLY_API_TOKEN` - get it by running `flyctl auth token`.
`NPM_TOKEN` - get it from FlatPeak npmjs account.

Commit to code to Github branch as specified in step 3
