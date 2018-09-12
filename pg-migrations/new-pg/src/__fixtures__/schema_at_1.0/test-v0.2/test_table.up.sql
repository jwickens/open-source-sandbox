-- this script serves to migrate it up to v0.2

-- simulate a longer running script
select pg_sleep(1);

alter table test add column tags text[];