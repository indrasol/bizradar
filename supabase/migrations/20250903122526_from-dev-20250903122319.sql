drop policy "Users can view their own subscriptions" on "public"."user_subscriptions";

alter table "public"."user_subscriptions" drop constraint "user_subscriptions_user_id_key";

alter table "public"."user_subscriptions" drop constraint "user_subscriptions_plan_type_check";

drop index if exists "public"."user_subscriptions_user_id_key";

alter table "public"."user_subscriptions" alter column "stripe_subscription_id" set data type character varying(255) using "stripe_subscription_id"::character varying(255);

CREATE INDEX idx_user_subscriptions_stripe_id ON public.user_subscriptions USING btree (stripe_subscription_id);

CREATE UNIQUE INDEX unique_user_id ON public.user_subscriptions USING btree (user_id);

alter table "public"."user_subscriptions" add constraint "unique_user_id" UNIQUE using index "unique_user_id";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_type_check" CHECK ((plan_type = ANY (ARRAY['free'::text, 'basic'::text, 'premium'::text, 'enterprise'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_type_check";


