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

v1 uses **monolith** architecture and **MVC** patten.

## Deploying the app

1. Download required files

Using curl:

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/BenjaminGuzman/webmock/v1/docker-compose.yml
curl -o .env.prod https://raw.githubusercontent.com/BenjaminGuzman/webmock/v1/.env.example
mkdir db
curl -o "db/db-init.sh" https://raw.githubusercontent.com/BenjaminGuzman/webmock/v1/db/db-init.sh
```

Using wget:

```bash
wget -O docker-compose.yml https://raw.githubusercontent.com/BenjaminGuzman/webmock/v1/docker-compose.yml
wget -O .env.prod https://raw.githubusercontent.com/BenjaminGuzman/webmock/v1/.env.example
mkdir db
curl -O "db/db-init.sh" https://raw.githubusercontent.com/BenjaminGuzman/webmock/v1/db/db-init.sh
```

2. Create required network and start containers

```bash
sudo docker network create webmock-net --driver bridge > /dev/null 2>&1
sudo docker compose up -d
```

That will spin up a plain-HTTP server

## Adding TLS

To add HTTPS it is suggested to spin up a non-dockerized nginx server to handle TLS.

Commands to do so in a RHEL machine are provided below.

```bash
# install nginx
sudo dnf install nginx

# install let's encrypt certificate
sudo dnf install epel-release
sudo dnf install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

After you have managed to install the certificates and you have the default nginx HTTPS
server running, simply configure it to forward all requests to the container 
by using a `proxy_pass` directive.

Since, by default, the application runs on port 80, you will also need to change 
exposed port in `docker-compose.yml`.

## Running the app locally

```bash
# development
npm run start

# watch mode
npm run start:dev
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
