# build environment
FROM node:16.14 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY ./AntGameAPI /usr/src/app
RUN npm install

ENV connection_string = ${connection_string}
ENV jwt_secret = ${jwt_secret}
ENV environment = ${environment}
ENV DO_SPACES_ENDPOINT = ${DO_SPACES_ENDPOINT}
ENV DO_SPACES_KEY = ${DO_SPACES_KEY}
ENV DO_SPACES_NAME = ${DO_SPACES_NAME}
ENV DO_SPACES_SECRET = ${DO_SPACES_SECRET}

RUN node app.js
