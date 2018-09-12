-- this script is a versioned script, but since it does
-- not have pre, post, or snap after the version in it 
-- it defaults to being a post indepotent or snapshot script

-- this script serves to migrate it up to the desired version
-- simulate a longer running script
select pg_sleep(1);

alter table test add column tags text[];