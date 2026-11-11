-- Fixed-window rate limiting for the API.
-- Run this once in the Supabase SQL editor (or with a DB URL).
-- The API fails open until this migration exists.

create table if not exists public.rate_limits (
    user_id uuid not null references auth.users(id) on delete cascade,
    window_start timestamptz not null,
    count int not null default 0,
    primary key (user_id, window_start)
);

alter table public.rate_limits enable row level security;

-- No policies on purpose: only the security-definer function below touches it.
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(
    p_user_id uuid,
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

    insert into public.rate_limits (user_id, window_start, count)
    values (p_user_id, v_window, 1)
    on conflict (user_id, window_start)
    do update set count = public.rate_limits.count + 1
    returning count into v_count;

    -- Keep the table small: one day of windows is enough for every limit here.
    delete from public.rate_limits where window_start < now() - interval '1 day';

    return v_count <= p_limit;
end;
$$;

grant execute on function public.check_rate_limit(uuid, int, int) to authenticated;

-- Postgres grants EXECUTE to PUBLIC by default, so anon could still call it and
-- burn another user's quota. Close that before the grant above takes effect.
revoke execute on function public.check_rate_limit(uuid, int, int) from public, anon;
