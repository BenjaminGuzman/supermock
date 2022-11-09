# Web mock (v1)

**Mock** web application. You can use it to learn about testing.

v1 is intentionally and deliberately developed with some errors and bad practices such as:

- Small pool size
- Backend code may use synchronized code (blocking the event loop)
- Database has some non-indexed tables
- MemoryStore is used to store sessions (memory leak)

On the other side, v2 is built without (known) errors and good practices.

You can automate some tests, execute them using v1 and then execute them with v2 and compare results

## Architecture

v1 uses **monolith** and **MVC** arch.

## Running the app locally

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Deploying the app

### Using docker

**Run on local machine**

1. Create your own `.env.prod` file (see [`.env.example`](.env.example))
2. (Optional) Modify [`db/db-init.sh`](db/db-init.sh)
3. Copy important files to server

```bash
# copy init files to server (run on local machine)
scp db/db-init.sh user@testing.example.com:~/db/db-init.sh
scp docker-compose.yml .env.prod user@testing.example.com:~ # you should create your own .env.prod, see .env.example 
```

**Run on server**

1Start the containers
```bash
sudo docker compose up -d
```

That will spin up an HTTP server

If you need an HTTPS server read below

## HTTPS server as reverse proxy

**Run on local machine**

```bash
# configure nginx (make sure you update the config before executing. Run on your local machine)
sed -i "s/testing.example.com/mydomain.com/" testing.example.com.conf && cp testing.example.com.conf mydomain.com.conf # make sure you update the domain name
scp mydomain.com.conf user@mydomain.com:/etc/nginx/conf.d/mydomain.com.conf
```

**Run on server**

```bash
# install nginx
sudo dnf install nginx

# install let's encrypt certificate (run on server)
sudo dnf install epel-release
sudo dnf install certbot python3-certbot-nginx
sudo certbot --nginx -d mydomain.com
```

## Usage

### Special endpoints

These endpoints don't need a request body, and usually they won't return a response body.
So, to check the operation was successfully you may check the response status code. 

- DELETE `/music`: Will clear the music database (users will remain intact)

- DELETE `/users`: Will clear all the users database (music will remain intact)

- POST `/populate`: Will insert some artists, albums and tracks in the database

## License

GPLv3
