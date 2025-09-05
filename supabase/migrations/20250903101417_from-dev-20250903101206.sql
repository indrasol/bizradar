CREATE UNIQUE INDEX user_subscriptions_user_id_key ON public.user_subscriptions USING btree (user_id);

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_key" UNIQUE using index "user_subscriptions_user_id_key";


