-- this is a second "snapshot" or the indepotent script as it was at version 0.2
-- here we have added the message_tags

-- v0.2 test table
create table if not exists test (
  id serial primary key,
  test_name text,
  tags text[]
);

-- converts posgres timestamp into JS-style milliseconds since epoch
CREATE OR REPLACE FUNCTION js_time(timestamptz) RETURNS bigint
AS $$
  select round(
    extract(EPOCH FROM $1 AT TIME ZONE 'UTC')
    * 1000
  )::bigint
$$ 
LANGUAGE SQL
IMMUTABLE
RETURNS NULL ON NULL INPUT;