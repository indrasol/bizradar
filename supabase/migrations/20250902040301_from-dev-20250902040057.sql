create type "public"."notification_type" as enum ('system', 'upgrade', 'support', 'opportunity');

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "type" notification_type not null,
    "title" text not null,
    "message" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."support_messages" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid,
    "user_id" uuid,
    "message" text not null,
    "is_staff" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."support_messages" enable row level security;

create table "public"."support_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "subject" text not null,
    "description" text not null,
    "status" text default 'open'::text,
    "priority" text default 'medium'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."support_tickets" enable row level security;

create table "public"."user_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "plan_type" text not null,
    "status" text not null,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_subscriptions" enable row level security;

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages USING btree (ticket_id);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX support_messages_pkey ON public.support_messages USING btree (id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."support_messages" add constraint "support_messages_pkey" PRIMARY KEY using index "support_messages_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."support_messages" add constraint "support_messages_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."support_messages" validate constraint "support_messages_ticket_id_fkey";

alter table "public"."support_messages" add constraint "support_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."support_messages" validate constraint "support_messages_user_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_priority_check";

alter table "public"."support_tickets" add constraint "support_tickets_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_status_check";

alter table "public"."support_tickets" add constraint "support_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_type_check" CHECK ((plan_type = ANY (ARRAY['free'::text, 'basic'::text, 'premium'::text, 'enterprise'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_type_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_status_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."support_messages" to "anon";

grant insert on table "public"."support_messages" to "anon";

grant references on table "public"."support_messages" to "anon";

grant select on table "public"."support_messages" to "anon";

grant trigger on table "public"."support_messages" to "anon";

grant truncate on table "public"."support_messages" to "anon";

grant update on table "public"."support_messages" to "anon";

grant delete on table "public"."support_messages" to "authenticated";

grant insert on table "public"."support_messages" to "authenticated";

grant references on table "public"."support_messages" to "authenticated";

grant select on table "public"."support_messages" to "authenticated";

grant trigger on table "public"."support_messages" to "authenticated";

grant truncate on table "public"."support_messages" to "authenticated";

grant update on table "public"."support_messages" to "authenticated";

grant delete on table "public"."support_messages" to "service_role";

grant insert on table "public"."support_messages" to "service_role";

grant references on table "public"."support_messages" to "service_role";

grant select on table "public"."support_messages" to "service_role";

grant trigger on table "public"."support_messages" to "service_role";

grant truncate on table "public"."support_messages" to "service_role";

grant update on table "public"."support_messages" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."user_subscriptions" to "anon";

grant insert on table "public"."user_subscriptions" to "anon";

grant references on table "public"."user_subscriptions" to "anon";

grant select on table "public"."user_subscriptions" to "anon";

grant trigger on table "public"."user_subscriptions" to "anon";

grant truncate on table "public"."user_subscriptions" to "anon";

grant update on table "public"."user_subscriptions" to "anon";

grant delete on table "public"."user_subscriptions" to "authenticated";

grant insert on table "public"."user_subscriptions" to "authenticated";

grant references on table "public"."user_subscriptions" to "authenticated";

grant select on table "public"."user_subscriptions" to "authenticated";

grant trigger on table "public"."user_subscriptions" to "authenticated";

grant truncate on table "public"."user_subscriptions" to "authenticated";

grant update on table "public"."user_subscriptions" to "authenticated";

grant delete on table "public"."user_subscriptions" to "service_role";

grant insert on table "public"."user_subscriptions" to "service_role";

grant references on table "public"."user_subscriptions" to "service_role";

grant select on table "public"."user_subscriptions" to "service_role";

grant trigger on table "public"."user_subscriptions" to "service_role";

grant truncate on table "public"."user_subscriptions" to "service_role";

grant update on table "public"."user_subscriptions" to "service_role";

create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create messages for their tickets"
on "public"."support_messages"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


create policy "Users can view messages for their tickets"
on "public"."support_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


create policy "Users can create their own tickets"
on "public"."support_tickets"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own tickets"
on "public"."support_tickets"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own tickets"
on "public"."support_tickets"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view their own subscriptions"
on "public"."user_subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


