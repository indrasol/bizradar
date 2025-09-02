create sequence "public"."conversations_id_seq";

create sequence "public"."etl_history_id_seq";

create sequence "public"."freelancer_data_table_id_seq";

create sequence "public"."messages_id_seq";

create sequence "public"."pursuit_followup_notes_id_seq";

create sequence "public"."rfp_responses_id_seq";

create sequence "public"."sam_gov_id_seq";

create table "public"."ai_enhanced_opportunities" (
    "id" integer not null default nextval('sam_gov_id_seq'::regclass),
    "notice_id" character varying(100),
    "solicitation_number" character varying(100),
    "title" character varying(255) not null,
    "department" character varying(255),
    "naics_code" integer,
    "published_date" date,
    "response_date" date,
    "description" text,
    "url" character varying(512),
    "active" boolean default true,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "additional_description" text,
    "sub_departments" text,
    "point_of_contact" json,
    "expected_outcome" character varying,
    "funding" text,
    "key_facts" character varying,
    "eligibility" character varying,
    "objective" character varying,
    "due_date" date
);


create table "public"."ai_enhanced_opportunities_history" (
    "id" integer not null,
    "notice_id" character varying(100),
    "solicitation_number" character varying(100),
    "title" character varying(255) not null,
    "department" character varying(255),
    "naics_code" integer,
    "published_date" date,
    "response_date" date,
    "description" text,
    "url" character varying(512),
    "active" boolean default true,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "additional_description" text,
    "archived_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "archived_by" character varying(100) default 'system'::character varying,
    "sub_departments" text,
    "point_of_contact" json,
    "expected_outcome" character varying,
    "funding" text,
    "key_facts" character varying,
    "eligibility" character varying,
    "objective" character varying,
    "due_date" date
);


create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "url" text,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."conversations" (
    "id" integer not null default nextval('conversations_id_seq'::regclass),
    "user_id" text not null,
    "pursuit_id" text,
    "title" text not null,
    "last_active" timestamp without time zone default CURRENT_TIMESTAMP,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP
);


create table "public"."etl_history" (
    "id" integer not null default nextval('etl_history_id_seq'::regclass),
    "time_fetched" timestamp without time zone default CURRENT_TIMESTAMP,
    "total_records" integer default 0,
    "sam_gov_count" integer default 0,
    "sam_gov_new_count" integer default 0,
    "freelancer_count" integer default 0,
    "freelancer_new_count" integer default 0,
    "status" character varying(50),
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "trigger_type" character varying(20) default 'manual'::character varying
);


create table "public"."freelancer_data_table" (
    "id" integer not null default nextval('freelancer_data_table_id_seq'::regclass),
    "job_url" text,
    "title" text,
    "published_date" text,
    "skills_required" text,
    "price_budget" text,
    "bids_so_far" text,
    "additional_details" text
);


create table "public"."messages" (
    "id" integer not null default nextval('messages_id_seq'::regclass),
    "conversation_id" integer not null,
    "type" text not null,
    "content" text not null,
    "timestamp" timestamp without time zone default CURRENT_TIMESTAMP,
    "sam_gov_url" text,
    "metadata" jsonb default '{}'::jsonb
);


create table "public"."newsletter_subscribers" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "subscribed_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."opportunities" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "status" text not null default 'Active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "due_date" timestamp with time zone,
    "user_id" uuid not null
);


create table "public"."profiles" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "full_name" text generated always as (((first_name || ' '::text) || last_name)) stored,
    "email" text not null,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "role" text not null default 'user'::text,
    "stripe_customer_id" character varying(255)
);


create table "public"."pursuit_assignees" (
    "id" uuid not null default gen_random_uuid(),
    "pursuit_id" character varying not null,
    "user_id" uuid not null,
    "assignee_code" text,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."pursuit_followup_notes" (
    "id" integer not null default nextval('pursuit_followup_notes_id_seq'::regclass),
    "pursuit_id" character varying not null,
    "user_id" text not null,
    "note" text not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."pursuits" (
    "id" character varying not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "stage" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "due_date" timestamp with time zone,
    "user_id" uuid not null,
    "is_submitted" boolean default false,
    "naicscode" text
);


create table "public"."rfp_responses" (
    "id" integer not null default nextval('rfp_responses_id_seq'::regclass),
    "pursuit_id" character varying not null,
    "user_id" character varying not null,
    "content" jsonb not null,
    "completion_percentage" integer not null default 0,
    "is_submitted" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."sam_gov" (
    "id" integer not null default nextval('sam_gov_id_seq'::regclass),
    "notice_id" character varying(100),
    "solicitation_number" character varying(100),
    "title" character varying(255) not null,
    "department" character varying(255),
    "naics_code" integer,
    "published_date" date,
    "response_date" date,
    "description" text,
    "url" character varying(512),
    "active" boolean default true,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "additional_description" text,
    "sub_departments" text[],
    "contact_info" text
);


create table "public"."sam_gov_csv" (
    "notice_id" character varying(255) not null,
    "description" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "created_by" character varying(100) default 'system'::character varying,
    "updated_by" character varying(100) default 'system'::character varying
);


create table "public"."sam_gov_history" (
    "id" integer not null,
    "notice_id" character varying(100),
    "solicitation_number" character varying(100),
    "title" character varying(255) not null,
    "department" character varying(255),
    "naics_code" integer,
    "published_date" date,
    "response_date" date,
    "description" text,
    "url" character varying(512),
    "active" boolean default true,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "additional_description" text,
    "archived_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "archived_by" character varying(100) default 'system'::character varying
);


create table "public"."sam_opportunities" (
    "id" text not null,
    "title" text,
    "department" text,
    "naics_code" text,
    "notice_id" text,
    "published_date" date,
    "response_date" text,
    "add_details_link" text,
    "add_details" text
);


create table "public"."user_companies" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "company_id" uuid not null,
    "role" text,
    "is_primary" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."user_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "email_notifications" boolean default true,
    "sms_notifications" boolean default false,
    "new_opportunity_alerts" boolean default true,
    "weekly_reports" boolean default true,
    "marketing_emails" boolean default false,
    "system_announcements" boolean default true,
    "opportunity_matches" boolean default true,
    "deadline_reminders" boolean default true,
    "system_announcements_in_app" boolean default true,
    "team_collaboration" boolean default true,
    "status_changes" boolean default true,
    "upcoming_deadlines" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."user_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "language" text default 'English (US)'::text,
    "time_zone" text default 'Eastern Time (US & Canada)'::text,
    "date_format" text default 'MM/DD/YYYY'::text,
    "theme" text default 'Light'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."user_security" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "two_factor_enabled" boolean default false,
    "login_notifications" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "backup_codes" text[],
    "recent_devices" jsonb
);


alter sequence "public"."conversations_id_seq" owned by "public"."conversations"."id";

alter sequence "public"."etl_history_id_seq" owned by "public"."etl_history"."id";

alter sequence "public"."freelancer_data_table_id_seq" owned by "public"."freelancer_data_table"."id";

alter sequence "public"."messages_id_seq" owned by "public"."messages"."id";

alter sequence "public"."pursuit_followup_notes_id_seq" owned by "public"."pursuit_followup_notes"."id";

alter sequence "public"."rfp_responses_id_seq" owned by "public"."rfp_responses"."id";

alter sequence "public"."sam_gov_id_seq" owned by "public"."sam_gov"."id";

CREATE UNIQUE INDEX ai_enhanced_opportunities_history_pkey ON public.ai_enhanced_opportunities_history USING btree (id);

CREATE UNIQUE INDEX ai_enhanced_opportunities_notice_id_key ON public.ai_enhanced_opportunities USING btree (notice_id);

CREATE UNIQUE INDEX ai_enhanced_opportunities_pkey ON public.ai_enhanced_opportunities USING btree (id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX etl_history_pkey ON public.etl_history USING btree (id);

CREATE UNIQUE INDEX freelancer_data_table_job_url_key ON public.freelancer_data_table USING btree (job_url);

CREATE UNIQUE INDEX freelancer_data_table_pkey ON public.freelancer_data_table USING btree (id);

CREATE INDEX idx_conversations_last_active ON public.conversations USING btree (last_active);

CREATE INDEX idx_conversations_pursuit_id ON public.conversations USING btree (pursuit_id);

CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);

CREATE INDEX idx_etl_history_trigger_type ON public.etl_history USING btree (trigger_type);

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);

CREATE INDEX idx_messages_timestamp ON public.messages USING btree ("timestamp");

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers USING btree (email);

CREATE INDEX idx_notice_id ON public.sam_gov_csv USING btree (notice_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX newsletter_subscribers_email_key ON public.newsletter_subscribers USING btree (email);

CREATE UNIQUE INDEX newsletter_subscribers_pkey ON public.newsletter_subscribers USING btree (id);

CREATE UNIQUE INDEX opportunities_pkey ON public.opportunities USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX pursuit_assignees_pkey ON public.pursuit_assignees USING btree (id);

CREATE UNIQUE INDEX pursuit_assignees_pursuit_id_user_id_key ON public.pursuit_assignees USING btree (pursuit_id, user_id);

CREATE UNIQUE INDEX pursuit_followup_notes_pkey ON public.pursuit_followup_notes USING btree (id);

CREATE UNIQUE INDEX pursuits_pkey ON public.pursuits USING btree (id);

CREATE UNIQUE INDEX rfp_responses_pkey ON public.rfp_responses USING btree (id);

CREATE UNIQUE INDEX sam_gov_csv_pkey ON public.sam_gov_csv USING btree (notice_id);

CREATE UNIQUE INDEX sam_gov_history_pkey ON public.sam_gov_history USING btree (id);

CREATE UNIQUE INDEX sam_gov_notice_id_key ON public.sam_gov USING btree (notice_id);

CREATE UNIQUE INDEX sam_gov_pkey ON public.sam_gov USING btree (id);

CREATE UNIQUE INDEX sam_opportunities_pkey ON public.sam_opportunities USING btree (id);

CREATE UNIQUE INDEX unique_pursuit_id ON public.rfp_responses USING btree (pursuit_id);

CREATE UNIQUE INDEX user_companies_pkey ON public.user_companies USING btree (id);

CREATE UNIQUE INDEX user_companies_user_id_company_id_key ON public.user_companies USING btree (user_id, company_id);

CREATE UNIQUE INDEX user_notifications_pkey ON public.user_notifications USING btree (id);

CREATE UNIQUE INDEX user_notifications_user_id_key ON public.user_notifications USING btree (user_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_security_pkey ON public.user_security USING btree (id);

CREATE UNIQUE INDEX user_security_user_id_key ON public.user_security USING btree (user_id);

alter table "public"."ai_enhanced_opportunities" add constraint "ai_enhanced_opportunities_pkey" PRIMARY KEY using index "ai_enhanced_opportunities_pkey";

alter table "public"."ai_enhanced_opportunities_history" add constraint "ai_enhanced_opportunities_history_pkey" PRIMARY KEY using index "ai_enhanced_opportunities_history_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."etl_history" add constraint "etl_history_pkey" PRIMARY KEY using index "etl_history_pkey";

alter table "public"."freelancer_data_table" add constraint "freelancer_data_table_pkey" PRIMARY KEY using index "freelancer_data_table_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."newsletter_subscribers" add constraint "newsletter_subscribers_pkey" PRIMARY KEY using index "newsletter_subscribers_pkey";

alter table "public"."opportunities" add constraint "opportunities_pkey" PRIMARY KEY using index "opportunities_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."pursuit_assignees" add constraint "pursuit_assignees_pkey" PRIMARY KEY using index "pursuit_assignees_pkey";

alter table "public"."pursuit_followup_notes" add constraint "pursuit_followup_notes_pkey" PRIMARY KEY using index "pursuit_followup_notes_pkey";

alter table "public"."pursuits" add constraint "pursuits_pkey" PRIMARY KEY using index "pursuits_pkey";

alter table "public"."rfp_responses" add constraint "rfp_responses_pkey" PRIMARY KEY using index "rfp_responses_pkey";

alter table "public"."sam_gov" add constraint "sam_gov_pkey" PRIMARY KEY using index "sam_gov_pkey";

alter table "public"."sam_gov_csv" add constraint "sam_gov_csv_pkey" PRIMARY KEY using index "sam_gov_csv_pkey";

alter table "public"."sam_gov_history" add constraint "sam_gov_history_pkey" PRIMARY KEY using index "sam_gov_history_pkey";

alter table "public"."sam_opportunities" add constraint "sam_opportunities_pkey" PRIMARY KEY using index "sam_opportunities_pkey";

alter table "public"."user_companies" add constraint "user_companies_pkey" PRIMARY KEY using index "user_companies_pkey";

alter table "public"."user_notifications" add constraint "user_notifications_pkey" PRIMARY KEY using index "user_notifications_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_security" add constraint "user_security_pkey" PRIMARY KEY using index "user_security_pkey";

alter table "public"."ai_enhanced_opportunities" add constraint "ai_enhanced_opportunities_notice_id_key" UNIQUE using index "ai_enhanced_opportunities_notice_id_key";

alter table "public"."freelancer_data_table" add constraint "freelancer_data_table_job_url_key" UNIQUE using index "freelancer_data_table_job_url_key";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_type_check" CHECK ((type = ANY (ARRAY['user'::text, 'ai'::text, 'system'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_type_check";

alter table "public"."newsletter_subscribers" add constraint "newsletter_subscribers_email_key" UNIQUE using index "newsletter_subscribers_email_key";

alter table "public"."opportunities" add constraint "opportunities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."opportunities" validate constraint "opportunities_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."pursuit_assignees" add constraint "pursuit_assignees_pursuit_id_fkey" FOREIGN KEY (pursuit_id) REFERENCES pursuits(id) not valid;

alter table "public"."pursuit_assignees" validate constraint "pursuit_assignees_pursuit_id_fkey";

alter table "public"."pursuit_assignees" add constraint "pursuit_assignees_pursuit_id_user_id_key" UNIQUE using index "pursuit_assignees_pursuit_id_user_id_key";

alter table "public"."pursuit_assignees" add constraint "pursuit_assignees_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."pursuit_assignees" validate constraint "pursuit_assignees_user_id_fkey";

alter table "public"."pursuit_followup_notes" add constraint "pursuit_followup_notes_pursuit_id_fkey" FOREIGN KEY (pursuit_id) REFERENCES pursuits(id) ON DELETE CASCADE not valid;

alter table "public"."pursuit_followup_notes" validate constraint "pursuit_followup_notes_pursuit_id_fkey";

alter table "public"."pursuits" add constraint "pursuits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."pursuits" validate constraint "pursuits_user_id_fkey";

alter table "public"."rfp_responses" add constraint "rfp_responses_pursuit_id_fkey" FOREIGN KEY (pursuit_id) REFERENCES pursuits(id) not valid;

alter table "public"."rfp_responses" validate constraint "rfp_responses_pursuit_id_fkey";

alter table "public"."rfp_responses" add constraint "unique_pursuit_id" UNIQUE using index "unique_pursuit_id";

alter table "public"."sam_gov" add constraint "sam_gov_notice_id_key" UNIQUE using index "sam_gov_notice_id_key";

alter table "public"."user_companies" add constraint "user_companies_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."user_companies" validate constraint "user_companies_company_id_fkey";

alter table "public"."user_companies" add constraint "user_companies_user_id_company_id_key" UNIQUE using index "user_companies_user_id_company_id_key";

alter table "public"."user_companies" add constraint "user_companies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."user_companies" validate constraint "user_companies_user_id_fkey";

alter table "public"."user_notifications" add constraint "user_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_notifications" validate constraint "user_notifications_user_id_fkey";

alter table "public"."user_notifications" add constraint "user_notifications_user_id_key" UNIQUE using index "user_notifications_user_id_key";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."user_security" add constraint "user_security_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_security" validate constraint "user_security_user_id_fkey";

alter table "public"."user_security" add constraint "user_security_user_id_key" UNIQUE using index "user_security_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now());
  return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.update_rfp_response_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$function$
;

grant delete on table "public"."ai_enhanced_opportunities" to "anon";

grant insert on table "public"."ai_enhanced_opportunities" to "anon";

grant references on table "public"."ai_enhanced_opportunities" to "anon";

grant select on table "public"."ai_enhanced_opportunities" to "anon";

grant trigger on table "public"."ai_enhanced_opportunities" to "anon";

grant truncate on table "public"."ai_enhanced_opportunities" to "anon";

grant update on table "public"."ai_enhanced_opportunities" to "anon";

grant delete on table "public"."ai_enhanced_opportunities" to "authenticated";

grant insert on table "public"."ai_enhanced_opportunities" to "authenticated";

grant references on table "public"."ai_enhanced_opportunities" to "authenticated";

grant select on table "public"."ai_enhanced_opportunities" to "authenticated";

grant trigger on table "public"."ai_enhanced_opportunities" to "authenticated";

grant truncate on table "public"."ai_enhanced_opportunities" to "authenticated";

grant update on table "public"."ai_enhanced_opportunities" to "authenticated";

grant delete on table "public"."ai_enhanced_opportunities" to "service_role";

grant insert on table "public"."ai_enhanced_opportunities" to "service_role";

grant references on table "public"."ai_enhanced_opportunities" to "service_role";

grant select on table "public"."ai_enhanced_opportunities" to "service_role";

grant trigger on table "public"."ai_enhanced_opportunities" to "service_role";

grant truncate on table "public"."ai_enhanced_opportunities" to "service_role";

grant update on table "public"."ai_enhanced_opportunities" to "service_role";

grant delete on table "public"."ai_enhanced_opportunities_history" to "anon";

grant insert on table "public"."ai_enhanced_opportunities_history" to "anon";

grant references on table "public"."ai_enhanced_opportunities_history" to "anon";

grant select on table "public"."ai_enhanced_opportunities_history" to "anon";

grant trigger on table "public"."ai_enhanced_opportunities_history" to "anon";

grant truncate on table "public"."ai_enhanced_opportunities_history" to "anon";

grant update on table "public"."ai_enhanced_opportunities_history" to "anon";

grant delete on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant insert on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant references on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant select on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant trigger on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant truncate on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant update on table "public"."ai_enhanced_opportunities_history" to "authenticated";

grant delete on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant insert on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant references on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant select on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant trigger on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant truncate on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant update on table "public"."ai_enhanced_opportunities_history" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."etl_history" to "anon";

grant insert on table "public"."etl_history" to "anon";

grant references on table "public"."etl_history" to "anon";

grant select on table "public"."etl_history" to "anon";

grant trigger on table "public"."etl_history" to "anon";

grant truncate on table "public"."etl_history" to "anon";

grant update on table "public"."etl_history" to "anon";

grant delete on table "public"."etl_history" to "authenticated";

grant insert on table "public"."etl_history" to "authenticated";

grant references on table "public"."etl_history" to "authenticated";

grant select on table "public"."etl_history" to "authenticated";

grant trigger on table "public"."etl_history" to "authenticated";

grant truncate on table "public"."etl_history" to "authenticated";

grant update on table "public"."etl_history" to "authenticated";

grant delete on table "public"."etl_history" to "service_role";

grant insert on table "public"."etl_history" to "service_role";

grant references on table "public"."etl_history" to "service_role";

grant select on table "public"."etl_history" to "service_role";

grant trigger on table "public"."etl_history" to "service_role";

grant truncate on table "public"."etl_history" to "service_role";

grant update on table "public"."etl_history" to "service_role";

grant delete on table "public"."freelancer_data_table" to "anon";

grant insert on table "public"."freelancer_data_table" to "anon";

grant references on table "public"."freelancer_data_table" to "anon";

grant select on table "public"."freelancer_data_table" to "anon";

grant trigger on table "public"."freelancer_data_table" to "anon";

grant truncate on table "public"."freelancer_data_table" to "anon";

grant update on table "public"."freelancer_data_table" to "anon";

grant delete on table "public"."freelancer_data_table" to "authenticated";

grant insert on table "public"."freelancer_data_table" to "authenticated";

grant references on table "public"."freelancer_data_table" to "authenticated";

grant select on table "public"."freelancer_data_table" to "authenticated";

grant trigger on table "public"."freelancer_data_table" to "authenticated";

grant truncate on table "public"."freelancer_data_table" to "authenticated";

grant update on table "public"."freelancer_data_table" to "authenticated";

grant delete on table "public"."freelancer_data_table" to "service_role";

grant insert on table "public"."freelancer_data_table" to "service_role";

grant references on table "public"."freelancer_data_table" to "service_role";

grant select on table "public"."freelancer_data_table" to "service_role";

grant trigger on table "public"."freelancer_data_table" to "service_role";

grant truncate on table "public"."freelancer_data_table" to "service_role";

grant update on table "public"."freelancer_data_table" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."newsletter_subscribers" to "anon";

grant insert on table "public"."newsletter_subscribers" to "anon";

grant references on table "public"."newsletter_subscribers" to "anon";

grant select on table "public"."newsletter_subscribers" to "anon";

grant trigger on table "public"."newsletter_subscribers" to "anon";

grant truncate on table "public"."newsletter_subscribers" to "anon";

grant update on table "public"."newsletter_subscribers" to "anon";

grant delete on table "public"."newsletter_subscribers" to "authenticated";

grant insert on table "public"."newsletter_subscribers" to "authenticated";

grant references on table "public"."newsletter_subscribers" to "authenticated";

grant select on table "public"."newsletter_subscribers" to "authenticated";

grant trigger on table "public"."newsletter_subscribers" to "authenticated";

grant truncate on table "public"."newsletter_subscribers" to "authenticated";

grant update on table "public"."newsletter_subscribers" to "authenticated";

grant delete on table "public"."newsletter_subscribers" to "service_role";

grant insert on table "public"."newsletter_subscribers" to "service_role";

grant references on table "public"."newsletter_subscribers" to "service_role";

grant select on table "public"."newsletter_subscribers" to "service_role";

grant trigger on table "public"."newsletter_subscribers" to "service_role";

grant truncate on table "public"."newsletter_subscribers" to "service_role";

grant update on table "public"."newsletter_subscribers" to "service_role";

grant delete on table "public"."opportunities" to "anon";

grant insert on table "public"."opportunities" to "anon";

grant references on table "public"."opportunities" to "anon";

grant select on table "public"."opportunities" to "anon";

grant trigger on table "public"."opportunities" to "anon";

grant truncate on table "public"."opportunities" to "anon";

grant update on table "public"."opportunities" to "anon";

grant delete on table "public"."opportunities" to "authenticated";

grant insert on table "public"."opportunities" to "authenticated";

grant references on table "public"."opportunities" to "authenticated";

grant select on table "public"."opportunities" to "authenticated";

grant trigger on table "public"."opportunities" to "authenticated";

grant truncate on table "public"."opportunities" to "authenticated";

grant update on table "public"."opportunities" to "authenticated";

grant delete on table "public"."opportunities" to "service_role";

grant insert on table "public"."opportunities" to "service_role";

grant references on table "public"."opportunities" to "service_role";

grant select on table "public"."opportunities" to "service_role";

grant trigger on table "public"."opportunities" to "service_role";

grant truncate on table "public"."opportunities" to "service_role";

grant update on table "public"."opportunities" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."pursuit_assignees" to "anon";

grant insert on table "public"."pursuit_assignees" to "anon";

grant references on table "public"."pursuit_assignees" to "anon";

grant select on table "public"."pursuit_assignees" to "anon";

grant trigger on table "public"."pursuit_assignees" to "anon";

grant truncate on table "public"."pursuit_assignees" to "anon";

grant update on table "public"."pursuit_assignees" to "anon";

grant delete on table "public"."pursuit_assignees" to "authenticated";

grant insert on table "public"."pursuit_assignees" to "authenticated";

grant references on table "public"."pursuit_assignees" to "authenticated";

grant select on table "public"."pursuit_assignees" to "authenticated";

grant trigger on table "public"."pursuit_assignees" to "authenticated";

grant truncate on table "public"."pursuit_assignees" to "authenticated";

grant update on table "public"."pursuit_assignees" to "authenticated";

grant delete on table "public"."pursuit_assignees" to "service_role";

grant insert on table "public"."pursuit_assignees" to "service_role";

grant references on table "public"."pursuit_assignees" to "service_role";

grant select on table "public"."pursuit_assignees" to "service_role";

grant trigger on table "public"."pursuit_assignees" to "service_role";

grant truncate on table "public"."pursuit_assignees" to "service_role";

grant update on table "public"."pursuit_assignees" to "service_role";

grant delete on table "public"."pursuit_followup_notes" to "anon";

grant insert on table "public"."pursuit_followup_notes" to "anon";

grant references on table "public"."pursuit_followup_notes" to "anon";

grant select on table "public"."pursuit_followup_notes" to "anon";

grant trigger on table "public"."pursuit_followup_notes" to "anon";

grant truncate on table "public"."pursuit_followup_notes" to "anon";

grant update on table "public"."pursuit_followup_notes" to "anon";

grant delete on table "public"."pursuit_followup_notes" to "authenticated";

grant insert on table "public"."pursuit_followup_notes" to "authenticated";

grant references on table "public"."pursuit_followup_notes" to "authenticated";

grant select on table "public"."pursuit_followup_notes" to "authenticated";

grant trigger on table "public"."pursuit_followup_notes" to "authenticated";

grant truncate on table "public"."pursuit_followup_notes" to "authenticated";

grant update on table "public"."pursuit_followup_notes" to "authenticated";

grant delete on table "public"."pursuit_followup_notes" to "service_role";

grant insert on table "public"."pursuit_followup_notes" to "service_role";

grant references on table "public"."pursuit_followup_notes" to "service_role";

grant select on table "public"."pursuit_followup_notes" to "service_role";

grant trigger on table "public"."pursuit_followup_notes" to "service_role";

grant truncate on table "public"."pursuit_followup_notes" to "service_role";

grant update on table "public"."pursuit_followup_notes" to "service_role";

grant delete on table "public"."pursuits" to "anon";

grant insert on table "public"."pursuits" to "anon";

grant references on table "public"."pursuits" to "anon";

grant select on table "public"."pursuits" to "anon";

grant trigger on table "public"."pursuits" to "anon";

grant truncate on table "public"."pursuits" to "anon";

grant update on table "public"."pursuits" to "anon";

grant delete on table "public"."pursuits" to "authenticated";

grant insert on table "public"."pursuits" to "authenticated";

grant references on table "public"."pursuits" to "authenticated";

grant select on table "public"."pursuits" to "authenticated";

grant trigger on table "public"."pursuits" to "authenticated";

grant truncate on table "public"."pursuits" to "authenticated";

grant update on table "public"."pursuits" to "authenticated";

grant delete on table "public"."pursuits" to "service_role";

grant insert on table "public"."pursuits" to "service_role";

grant references on table "public"."pursuits" to "service_role";

grant select on table "public"."pursuits" to "service_role";

grant trigger on table "public"."pursuits" to "service_role";

grant truncate on table "public"."pursuits" to "service_role";

grant update on table "public"."pursuits" to "service_role";

grant delete on table "public"."rfp_responses" to "anon";

grant insert on table "public"."rfp_responses" to "anon";

grant references on table "public"."rfp_responses" to "anon";

grant select on table "public"."rfp_responses" to "anon";

grant trigger on table "public"."rfp_responses" to "anon";

grant truncate on table "public"."rfp_responses" to "anon";

grant update on table "public"."rfp_responses" to "anon";

grant delete on table "public"."rfp_responses" to "authenticated";

grant insert on table "public"."rfp_responses" to "authenticated";

grant references on table "public"."rfp_responses" to "authenticated";

grant select on table "public"."rfp_responses" to "authenticated";

grant trigger on table "public"."rfp_responses" to "authenticated";

grant truncate on table "public"."rfp_responses" to "authenticated";

grant update on table "public"."rfp_responses" to "authenticated";

grant delete on table "public"."rfp_responses" to "service_role";

grant insert on table "public"."rfp_responses" to "service_role";

grant references on table "public"."rfp_responses" to "service_role";

grant select on table "public"."rfp_responses" to "service_role";

grant trigger on table "public"."rfp_responses" to "service_role";

grant truncate on table "public"."rfp_responses" to "service_role";

grant update on table "public"."rfp_responses" to "service_role";

grant delete on table "public"."sam_gov" to "anon";

grant insert on table "public"."sam_gov" to "anon";

grant references on table "public"."sam_gov" to "anon";

grant select on table "public"."sam_gov" to "anon";

grant trigger on table "public"."sam_gov" to "anon";

grant truncate on table "public"."sam_gov" to "anon";

grant update on table "public"."sam_gov" to "anon";

grant delete on table "public"."sam_gov" to "authenticated";

grant insert on table "public"."sam_gov" to "authenticated";

grant references on table "public"."sam_gov" to "authenticated";

grant select on table "public"."sam_gov" to "authenticated";

grant trigger on table "public"."sam_gov" to "authenticated";

grant truncate on table "public"."sam_gov" to "authenticated";

grant update on table "public"."sam_gov" to "authenticated";

grant delete on table "public"."sam_gov" to "service_role";

grant insert on table "public"."sam_gov" to "service_role";

grant references on table "public"."sam_gov" to "service_role";

grant select on table "public"."sam_gov" to "service_role";

grant trigger on table "public"."sam_gov" to "service_role";

grant truncate on table "public"."sam_gov" to "service_role";

grant update on table "public"."sam_gov" to "service_role";

grant delete on table "public"."sam_gov_csv" to "anon";

grant insert on table "public"."sam_gov_csv" to "anon";

grant references on table "public"."sam_gov_csv" to "anon";

grant select on table "public"."sam_gov_csv" to "anon";

grant trigger on table "public"."sam_gov_csv" to "anon";

grant truncate on table "public"."sam_gov_csv" to "anon";

grant update on table "public"."sam_gov_csv" to "anon";

grant delete on table "public"."sam_gov_csv" to "authenticated";

grant insert on table "public"."sam_gov_csv" to "authenticated";

grant references on table "public"."sam_gov_csv" to "authenticated";

grant select on table "public"."sam_gov_csv" to "authenticated";

grant trigger on table "public"."sam_gov_csv" to "authenticated";

grant truncate on table "public"."sam_gov_csv" to "authenticated";

grant update on table "public"."sam_gov_csv" to "authenticated";

grant delete on table "public"."sam_gov_csv" to "service_role";

grant insert on table "public"."sam_gov_csv" to "service_role";

grant references on table "public"."sam_gov_csv" to "service_role";

grant select on table "public"."sam_gov_csv" to "service_role";

grant trigger on table "public"."sam_gov_csv" to "service_role";

grant truncate on table "public"."sam_gov_csv" to "service_role";

grant update on table "public"."sam_gov_csv" to "service_role";

grant delete on table "public"."sam_gov_history" to "anon";

grant insert on table "public"."sam_gov_history" to "anon";

grant references on table "public"."sam_gov_history" to "anon";

grant select on table "public"."sam_gov_history" to "anon";

grant trigger on table "public"."sam_gov_history" to "anon";

grant truncate on table "public"."sam_gov_history" to "anon";

grant update on table "public"."sam_gov_history" to "anon";

grant delete on table "public"."sam_gov_history" to "authenticated";

grant insert on table "public"."sam_gov_history" to "authenticated";

grant references on table "public"."sam_gov_history" to "authenticated";

grant select on table "public"."sam_gov_history" to "authenticated";

grant trigger on table "public"."sam_gov_history" to "authenticated";

grant truncate on table "public"."sam_gov_history" to "authenticated";

grant update on table "public"."sam_gov_history" to "authenticated";

grant delete on table "public"."sam_gov_history" to "service_role";

grant insert on table "public"."sam_gov_history" to "service_role";

grant references on table "public"."sam_gov_history" to "service_role";

grant select on table "public"."sam_gov_history" to "service_role";

grant trigger on table "public"."sam_gov_history" to "service_role";

grant truncate on table "public"."sam_gov_history" to "service_role";

grant update on table "public"."sam_gov_history" to "service_role";

grant delete on table "public"."sam_opportunities" to "anon";

grant insert on table "public"."sam_opportunities" to "anon";

grant references on table "public"."sam_opportunities" to "anon";

grant select on table "public"."sam_opportunities" to "anon";

grant trigger on table "public"."sam_opportunities" to "anon";

grant truncate on table "public"."sam_opportunities" to "anon";

grant update on table "public"."sam_opportunities" to "anon";

grant delete on table "public"."sam_opportunities" to "authenticated";

grant insert on table "public"."sam_opportunities" to "authenticated";

grant references on table "public"."sam_opportunities" to "authenticated";

grant select on table "public"."sam_opportunities" to "authenticated";

grant trigger on table "public"."sam_opportunities" to "authenticated";

grant truncate on table "public"."sam_opportunities" to "authenticated";

grant update on table "public"."sam_opportunities" to "authenticated";

grant delete on table "public"."sam_opportunities" to "service_role";

grant insert on table "public"."sam_opportunities" to "service_role";

grant references on table "public"."sam_opportunities" to "service_role";

grant select on table "public"."sam_opportunities" to "service_role";

grant trigger on table "public"."sam_opportunities" to "service_role";

grant truncate on table "public"."sam_opportunities" to "service_role";

grant update on table "public"."sam_opportunities" to "service_role";

grant delete on table "public"."user_companies" to "anon";

grant insert on table "public"."user_companies" to "anon";

grant references on table "public"."user_companies" to "anon";

grant select on table "public"."user_companies" to "anon";

grant trigger on table "public"."user_companies" to "anon";

grant truncate on table "public"."user_companies" to "anon";

grant update on table "public"."user_companies" to "anon";

grant delete on table "public"."user_companies" to "authenticated";

grant insert on table "public"."user_companies" to "authenticated";

grant references on table "public"."user_companies" to "authenticated";

grant select on table "public"."user_companies" to "authenticated";

grant trigger on table "public"."user_companies" to "authenticated";

grant truncate on table "public"."user_companies" to "authenticated";

grant update on table "public"."user_companies" to "authenticated";

grant delete on table "public"."user_companies" to "service_role";

grant insert on table "public"."user_companies" to "service_role";

grant references on table "public"."user_companies" to "service_role";

grant select on table "public"."user_companies" to "service_role";

grant trigger on table "public"."user_companies" to "service_role";

grant truncate on table "public"."user_companies" to "service_role";

grant update on table "public"."user_companies" to "service_role";

grant delete on table "public"."user_notifications" to "anon";

grant insert on table "public"."user_notifications" to "anon";

grant references on table "public"."user_notifications" to "anon";

grant select on table "public"."user_notifications" to "anon";

grant trigger on table "public"."user_notifications" to "anon";

grant truncate on table "public"."user_notifications" to "anon";

grant update on table "public"."user_notifications" to "anon";

grant delete on table "public"."user_notifications" to "authenticated";

grant insert on table "public"."user_notifications" to "authenticated";

grant references on table "public"."user_notifications" to "authenticated";

grant select on table "public"."user_notifications" to "authenticated";

grant trigger on table "public"."user_notifications" to "authenticated";

grant truncate on table "public"."user_notifications" to "authenticated";

grant update on table "public"."user_notifications" to "authenticated";

grant delete on table "public"."user_notifications" to "service_role";

grant insert on table "public"."user_notifications" to "service_role";

grant references on table "public"."user_notifications" to "service_role";

grant select on table "public"."user_notifications" to "service_role";

grant trigger on table "public"."user_notifications" to "service_role";

grant truncate on table "public"."user_notifications" to "service_role";

grant update on table "public"."user_notifications" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_security" to "anon";

grant insert on table "public"."user_security" to "anon";

grant references on table "public"."user_security" to "anon";

grant select on table "public"."user_security" to "anon";

grant trigger on table "public"."user_security" to "anon";

grant truncate on table "public"."user_security" to "anon";

grant update on table "public"."user_security" to "anon";

grant delete on table "public"."user_security" to "authenticated";

grant insert on table "public"."user_security" to "authenticated";

grant references on table "public"."user_security" to "authenticated";

grant select on table "public"."user_security" to "authenticated";

grant trigger on table "public"."user_security" to "authenticated";

grant truncate on table "public"."user_security" to "authenticated";

grant update on table "public"."user_security" to "authenticated";

grant delete on table "public"."user_security" to "service_role";

grant insert on table "public"."user_security" to "service_role";

grant references on table "public"."user_security" to "service_role";

grant select on table "public"."user_security" to "service_role";

grant trigger on table "public"."user_security" to "service_role";

grant truncate on table "public"."user_security" to "service_role";

grant update on table "public"."user_security" to "service_role";

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pursuits_updated_at BEFORE UPDATE ON public.pursuits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_companies_updated_at BEFORE UPDATE ON public.user_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_notifications BEFORE UPDATE ON public.user_notifications FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_security BEFORE UPDATE ON public.user_security FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


