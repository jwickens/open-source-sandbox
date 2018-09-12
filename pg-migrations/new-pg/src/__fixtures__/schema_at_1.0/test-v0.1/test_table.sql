-- this is a versioned "snapshot" script
-- it should represent one of the "indepotent scripts"
-- at an earlier version

-- v0.1 test table
create table if not exists test (
  id serial primary key,
  test_name text
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
