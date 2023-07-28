<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Setup

### Environments

See `env/readme.md` for instructions on setting up environment variables. The following environments are required to run the scripts in `package.json` (these can be renamed to anything, however, be sure to edit the package.json scripts to use your custom environment names):

- `dev-test` : All test scripts use this environment, as well as the GitHub workflow.
- `dev` : All start scripts (except `start:prod`) use this environment.

### ESLint

This project uses [ESLint](https://eslint.org/) to catch problems in the code. The settings are defined in `.eslintrc.js`.

### Prettier

This project uses [Prettier](https://prettier.io/) to automatically format code. The settings are defined in `.prettierrc`.

### GitHub

This repository is a template repository. You can create a new repository based on this one by clicking `Use this template > Create a new repository` at the top of the GitHub repository.

`.github/workflows/build-and-test.yml` contains a GitHub Actions workflow for automatically running tests when a pull request is opened. It creates a local postgreSQL database to run the tests. The workflow relies on an actions secret that you must define at `Settings > Security > Secrets and variables > Actions > New repository secret`. Name the secret `ENV_DEV_TEST`. See the `Environments` section above for setting up the properties in this secret. This is basically an env file stored on GitHub. The workflow will grab this secret and convert it into a file named `env/.env.dev-test` for use in the testing step.

## Modules

### AppModule

This is the root module that starts the application. The AppController provides basic information about the app. The following routes are available:

- `/` : Returns a 'Hello World!' message along with an HTTP status of 200 for verifying the app is running.
- `/env` : Returns what environment (e.g., test, prod, etc.) the app is currently running in.

### AuthModule

The AuthModule provides an `AccessTokenGuard` that can be used to protect selected routes. To add authorization to any module, import the AuthModule and add the following decorator to the controller or route:

```typescript
// Add authentication to example.module.ts
@Module({
  imports: [AuthModule]
})
export class ExampleModule {}

// Authenticate all routes in example.controller.ts
@UseGuards(AccessTokenGuard)
@Controller('/example')
export class ExampleController {}

// Authenticate only this specific route
@UseGuards(AccessTokenGuard)
@Get()
getAll() {}
```

Any route with this decorator will require a valid access token to access the API's resources. This JSON Web Token (JWT) must be generated using a shared secret between the API and a separate authorization server. Save the shared secret in an env file as

```bash
JWT_ACCESS_SECRET=your_shared_secret
```

If you do not want authorization, you can delete the AuthModule and remove its import statement in the other modules, or simply just exclude the `@UseGuards` decorator from your routes.

### LogModule

This module exports a custom LogService that can be used in other modules for application logging. By default, logging is turned off in the `dev-test` environment (the environment that all tests are run on). If you want to turn logging off in any other environment, add the property `LOGS=false` to the appropriate env file.

### CoreModule

This module is intended to house all the core services that the application provides so that all related entities are together in one module. The module contains a `Thing` entity that serves as a template for creating controllers, services, entities, DTOs, and unit tests.

The ThingController exposes the following endpoints:

- `POST /api/things` : Creates a new thing from the `ThingCreateDto` passed in the request body
- `GET /api/things` : Retrieves all things in the database
- `GET /api/things/:id` : Retrieves the thing identified by `:id`
- `PATCH /api/things/:id` : Updates the thing identified by `:id` based on the `ThingUpdateDto` passed in the request body
- `DELETE /api/things/:id` : Deletes the thing identified by `:id`

### Shared directory

This directory (not a module) contains files that are consumed/shared by the other modules.

## Abstract entities

### Base entity

The Base entity is an abstract entity containing properties that should apply to all entities, like `createDate` and `updateDate`. If there are other properties that should apply to all entities, add them to this class and have all entities extend from Base.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## References

- I referenced tutorials from [elvisduru.com](https://www.elvisduru.com/blog/nestjs-jwt-authentication-refresh-token) and [docs.nestjs.com](https://docs.nestjs.com/security/authentication) for creating the AuthModule
