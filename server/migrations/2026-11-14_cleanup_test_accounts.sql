-- Delete the accounts the test harness created.
--
-- Every Microfish run signs up a real user (microfish+<epoch>@...) and every load
-- test creates its own (loadtest+<epoch>@...). They are disposable, and the
-- Microfish transcripts in git history contain their old passwords, so they must
-- not stay valid.
--
-- Run once in the Supabase SQL editor. Inspect the counts first; the delete is
-- scoped to the two prefixes and touches nothing else.

-- 1. What will be removed.
select split_part(email, '+', 1) as kind, count(*) as accounts
from auth.users
where email like 'microfish+%@%' or email like 'loadtest+%@%'
group by 1
order by 1;

-- 2. Rows that belong to them (harmless if the FK already cascades).
delete from public.diary_entries
where user_id in (
    select id from auth.users
    where email like 'microfish+%@%' or email like 'loadtest+%@%'
);

delete from public.rate_limits
where user_id in (
    select id from auth.users
    where email like 'microfish+%@%' or email like 'loadtest+%@%'
);

-- 3. The accounts themselves.
delete from auth.users
where email like 'microfish+%@%' or email like 'loadtest+%@%';

-- 4. Confirm nothing is left.
select count(*) as remaining
from auth.users
where email like 'microfish+%@%' or email like 'loadtest+%@%';
