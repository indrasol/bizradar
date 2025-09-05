create extension if not exists "vector" with schema "public" version '0.8.0';

alter table "public"."ai_enhanced_opportunities" add column "embedding" vector(1536);

alter table "public"."ai_enhanced_opportunities" add column "embedding_model" text default 'text-embedding-3-small'::text;

alter table "public"."ai_enhanced_opportunities" add column "embedding_text" text;

alter table "public"."ai_enhanced_opportunities" add column "embedding_version" integer default 1;

alter table "public"."ai_enhanced_opportunities" add column "search_tsv" tsvector;

CREATE INDEX idx_ai_opp_embedding_ivfflat ON public.ai_enhanced_opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');

CREATE INDEX idx_ai_opp_search_tsv ON public.ai_enhanced_opportunities USING gin (search_tsv);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.ai_opp_tsvector_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.search_tsv :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.objective,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.key_facts,'')), 'C');
  return new;
end$function$
;

CREATE OR REPLACE FUNCTION public.match_ai_enhanced_opps(query_embedding vector, match_count integer DEFAULT 50, only_active boolean DEFAULT true)
 RETURNS TABLE(notice_id text, title text, department text, naics_code integer, description text, url text, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  select a.notice_id, a.title, a.department, a.naics_code, a.description, a.url,
         1 - (a.embedding <#> query_embedding) as similarity
  from public.ai_enhanced_opportunities a
  where a.embedding is not null
    and (not only_active or a.active is true)
  order by a.embedding <#> query_embedding
  limit match_count;
$function$
;

CREATE TRIGGER trg_ai_opp_tsv BEFORE INSERT OR UPDATE OF title, description, objective, key_facts ON public.ai_enhanced_opportunities FOR EACH ROW EXECUTE FUNCTION ai_opp_tsvector_trigger();


