-- clean setup script for version 0.4

-- just a test table that looks like some kind of messaging system
create table if not exists test (
  id serial primary key,
  test_name text,
  message text,
  tags text[]
);

-- text search index
create index trgm_idx on test USING gin (message gin_trgm_ops);

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
