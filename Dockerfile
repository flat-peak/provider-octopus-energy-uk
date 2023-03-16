FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
ARG NPM_TOKEN
COPY [".npmrc", "package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && rm -f .npmrc && mv node_modules ../
COPY . .
EXPOSE 8080
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
