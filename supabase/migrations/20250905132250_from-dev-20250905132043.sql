alter table "public"."user_subscriptions" drop constraint "user_subscriptions_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_auth_users_fk" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_auth_users_fk";


