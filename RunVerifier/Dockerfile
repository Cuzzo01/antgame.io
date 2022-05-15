# build environment
FROM node:16.14 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY ./RunVerifier /usr/src/app
RUN npm ci

ARG environment=${environment}
ENV environment=${environment}
ARG connection_string=${connection_string}
ENV connection_string=${connection_string}
ARG logzio_token=${logzio_token}
ENV logzio_token=${logzio_token}
ARG antapi_name=${antapi_name}
ENV antapi_name=${antapi_name}
ARG antapi_token=${antapi_token}
ENV antapi_token=${antapi_token}

CMD [ "node", "index.js" ]
