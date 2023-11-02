## Octopus Energy UK Integration

FlatPeak integration with Octopus Energy UK using [Node.JS](<https://nodejs.dev/>).

### Install tools

Tools used to develop this project.

- [Node](https://nodejs.dev)
- [Flyctl](https://fly.io/docs/flyctl/installing/)


### Run locally

- Clone this repository
- copy `.env.blank` to `.env` and set vars
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

##### 4. Add SSL certificates
<https://fly.io/docs/app-guides/custom-domains-with-fly/>

##### 5. Configure deployment via github actions

Set repository action secrets for:

`FLY_API_TOKEN` - get it by running `flyctl auth token`.

Commit to code to Github branch as specified in step 3
