create table if not exists my_model (
  id bigserial primary key,
  organization_id bigint not null,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  deleted_at timestamptz,
  my_field text
);