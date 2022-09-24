FROM node:14-alpine

WORKDIR /usr/src/app
COPY package* ./
COPY src ./src
COPY tsconfig.json ./
RUN npm install && npm install -g typescript \
&& tsc -p ./tsconfig.json && npm uninstall -g typescript \ 
&& npm prune --production
CMD [ "node", "./build/index.js"]