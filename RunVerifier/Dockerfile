# build environment
FROM node:16.14 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY ./RunVerifier /usr/src/app
RUN npm install

ENV environment = ${environment}
ENV connection_string = ${connection_string}
ENV logzio_token = ${logzio_token}

RUN node index.js
