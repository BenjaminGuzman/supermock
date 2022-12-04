psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres <<-EOSQL
	CREATE USER mock_admin;
  CREATE DATABASE mockv2;
  ALTER DATABASE mockv2 OWNER TO mock_admin;
  ALTER USER mock_admin WITH PASSWORD 'pass1234';
EOSQL

# ls -lah # use it for debugging

psql -v ON_ERROR_STOP=1 --username mock_admin --dbname mockv2 < /docker-entrypoint-initdb.d/002-ddl.sql
