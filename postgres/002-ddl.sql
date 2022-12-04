CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v1(),
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    dob DATE NOT NULL,
    gender SMALLINT NOT NULL,
    password VARCHAR NOT NULL
);

CREATE INDEX username_hash_idx ON users USING hash(username);
CREATE INDEX email_hash_idx ON users USING hash(email);

CREATE TABLE artists(
    id BIGINT PRIMARY KEY,
    name VARCHAR NOT NULL,
    link VARCHAR,
    picture VARCHAR,
    n_albums INT,
    n_fans INT
);

CREATE TABLE albums(
    id BIGINT PRIMARY KEY,
    title VARCHAR NOT NULL,
    link VARCHAR,
    cover VARCHAR,
    artist_id BIGINT REFERENCES artists(id) NOT NULL
);

CREATE TABLE tracks(
    id BIGINT PRIMARY KEY,
    title VARCHAR NOT NULL,
    link VARCHAR,
    preview VARCHAR,
    price NUMERIC NOT NULL,
    album_id BIGINT REFERENCES albums(id) NOT NULL
);

-- TODO create fuzzy search index
