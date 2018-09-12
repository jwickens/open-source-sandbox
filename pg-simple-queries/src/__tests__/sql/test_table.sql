-- since this script has no version it is a so-called "indepotent" script
-- it is the only script run by default in the dev evironment and serves
-- as a "gold standard".
-- here we are simulating the indepotent that would be when for a "1.0 release"

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
