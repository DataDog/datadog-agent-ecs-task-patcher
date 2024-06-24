FROM node:alpine3.19

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN apk add docker-cli
RUN npm install
RUN npm -g install
