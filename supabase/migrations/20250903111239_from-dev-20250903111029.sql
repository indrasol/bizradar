alter table "public"."user_subscriptions" add column "stripe_subscription_id" character varying;

alter table "public"."user_subscriptions" disable row level security;


