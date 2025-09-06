alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."user_companies" drop constraint "user_companies_user_id_fkey";

alter table "public"."profiles" drop column "company_domain_url";

alter table "public"."profiles" add column "company_markdown" text;

alter table "public"."profiles" add column "company_url" text;

alter table "public"."user_subscriptions" add column "ai_rfp_responses_used" integer;

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."user_companies" add constraint "user_companies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_companies" validate constraint "user_companies_user_id_fkey";


