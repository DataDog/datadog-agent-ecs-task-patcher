FROM node

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm -g install