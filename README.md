#KARAOKE!

### Start frontend

- `cd ./frontend`
- `npm install`
- `npm start`

### Start backend

- `cd ./backend`
- `npm install`
- `npm run dev`

### Backend needs .env file in /backend directory with the following variables:

```
PORT=4000
GRAPHQL_PATH=/graphql
NODE_ENV=development
MONGODB_URI=*url for MongoDb database hosted locally or online*
```

### Run scraper

- `cd ./scraper`
- `npm install`
- `npm start`

### Scraper needs .env file in /scraper directory with the following variables:

```
YT_API_KEY=*your YouTube Data Api v3 api key*
PHPSESSID=*PHP sessiond ID header that you get after logging in to USDB.animux.de*. You can also just use mine, which is 426hf5fe109rmrlokn0svkv8a1
```
