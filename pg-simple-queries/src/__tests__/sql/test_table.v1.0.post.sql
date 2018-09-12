update test 
  set message = 'hello there c tags'
  where tags && '{"c"}';

update test 
  set message = 'oopa how ya doing there b'
  where tags && '{"b"}';

update test
  set message = 'these messages have a default'
  where message is null;

-- simulate a longer running script
select pg_sleep(1);