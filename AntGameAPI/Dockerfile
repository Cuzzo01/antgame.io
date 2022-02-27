# build environment
FROM node:16.14 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY ./AntGameAPI /usr/src/app
RUN npm install
RUN node app.js
