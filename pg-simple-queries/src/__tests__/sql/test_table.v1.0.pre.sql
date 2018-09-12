alter table test add column message text;

create index trgm_idx on test USING gin (message gin_trgm_ops);

-- simulate a longer running script
select pg_sleep(1);