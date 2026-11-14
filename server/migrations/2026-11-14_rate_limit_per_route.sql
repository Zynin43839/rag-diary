-- Per-route rate limiting.
--
-- The first version keyed the counter on (user_id, window_start) only, so every
-- route shared one bucket: ten searches then one image request counted as eleven
-- calls against the 5/min image limit. This migration adds the route to the key.
--
-- Run once in the Supabase SQL editor. The API keeps working if you deploy it
-- before running this, because the limiter fails open when the RPC is missing.

alter table public.rate_limits
    add column if not exists route text not null default 'default';

-- Replace the primary key so one user can hold a counter per route.
alter table public.rate_limits drop constraint if exists rate_limits_pkey;
alter table public.rate_limits
    add constraint rate_limits_pkey primary key (user_id, route, window_start);

-- The three-argument version is replaced, not overloaded: leaving both would let
-- a caller keep using the shared counter by accident.
drop function if exists public.check_rate_limit(uuid, int, int);

create or replace function public.check_rate_limit(
    p_user_id uuid,
    p_route text,
    p_limit int,
    p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_window timestamptz;
    v_count int;
begin
    v_window := to_timestamp(
        floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
    );

    insert into public.rate_limits (user_id, route, window_start, count)
    values (p_user_id, p_route, v_window, 1)
    on conflict (user_id, route, window_start)
    do update set count = public.rate_limits.count + 1
    returning count into v_count;

    -- Keep the table small: one day of windows is enough for every limit here.
    delete from public.rate_limits where window_start < now() - interval '1 day';

    return v_count <= p_limit;
end;
$$;

grant execute on function public.check_rate_limit(uuid, text, int, int) to authenticated;

-- Postgres grants EXECUTE to PUBLIC by default, so anon could still call it and
-- burn another user's quota. Close that before the grant above takes effect.
revoke execute on function public.check_rate_limit(uuid, text, int, int) from public, anon;
