# ExternalTaskAPI Integration Tests

This folder contains integration tests for the ExternalTaskAPI.

## What are the goals of this project?

The goal of this is to make sure that the ExternalTaskAPI is behaving as described.

## How do I set this project up?

### Prerequesites

- Node `>= 8.x` + npm `>= 5.4.0`
- Docker `>= 17.5.0`

### Setup/Installation

1. When using Postgres, you can see/set the required settings for each repository,
   at the following location:
   `config/postgres/process_engine`

   For a dockerized and ready-to-go database setup, see the [Database Script](https://github.com/process-engine/process_engine_runtime/tree/develop/scripts/database)
   of the ProcessEngine Runtime.

   When using SQLite, no manual setup is required.
2. run `npm install` to install all dependencies.
3. run `npm run build` to ensure all typescript files are transpiled.

### Seeding

There is no seeding required.

## How do I use this project?

### Usage

Run `npm test` in this folder.

## What else is there to know?

### Authors/Contact information

- Christian Werner
