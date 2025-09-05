set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_ai_enhanced_opps_all(query_embedding vector, match_count integer DEFAULT 50, only_active boolean DEFAULT true)
 RETURNS TABLE(doc jsonb, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  select
    to_jsonb(a) as doc,
    1 - (a.embedding <#> query_embedding) as similarity
  from public.ai_enhanced_opportunities a
  where a.embedding is not null
    and (not only_active or a.active is true)
  order by a.embedding <#> query_embedding
  limit match_count;
$function$
;


