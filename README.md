## Description

Backend API for the B2 Finance application.

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
