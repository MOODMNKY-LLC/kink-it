SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."dynamic_role" AS ENUM (
    'dominant',
    'submissive',
    'switch'
);


ALTER TYPE "public"."dynamic_role" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  user_count integer;
  is_admin boolean;
begin
  -- Check if this is the first user (count all users in auth.users)
  select count(*) into user_count from auth.users;
  
  -- First user (count will be 1 since trigger runs after insert) becomes admin
  is_admin := (user_count = 1);
  
  -- Insert profile with appropriate role
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    display_name, 
    dynamic_role,
    system_role,
    love_languages
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'dynamic_role')::dynamic_role, 'submissive'),
    case when is_admin then 'admin'::user_role else 'user'::user_role end,
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x),
      array[]::text[]
    )
  );
  
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_ideas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_by" "text" NOT NULL,
    "assigned_to" "text",
    "notion_page_id" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_ideas_category_check" CHECK (("category" = ANY (ARRAY['feature'::"text", 'improvement'::"text", 'bug'::"text", 'design'::"text", 'content'::"text"]))),
    CONSTRAINT "app_ideas_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "app_ideas_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'completed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."app_ideas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text" NOT NULL,
    "full_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "system_role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "dynamic_role" "public"."dynamic_role" NOT NULL,
    "partner_id" "uuid",
    "love_languages" "text"[] DEFAULT ARRAY[]::"text"[],
    "hard_limits" "text"[] DEFAULT ARRAY[]::"text"[],
    "soft_limits" "text"[] DEFAULT ARRAY[]::"text"[],
    "notifications_enabled" boolean DEFAULT true,
    "theme_preference" "text" DEFAULT 'dark'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_ideas"
    ADD CONSTRAINT "app_ideas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "app_ideas_created_at_idx" ON "public"."app_ideas" USING "btree" ("created_at" DESC);



CREATE INDEX "app_ideas_priority_idx" ON "public"."app_ideas" USING "btree" ("priority");



CREATE INDEX "app_ideas_status_idx" ON "public"."app_ideas" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "app_ideas_updated_at" BEFORE UPDATE ON "public"."app_ideas" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE "public"."app_ideas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_ideas_delete_own" ON "public"."app_ideas" FOR DELETE USING ((("auth"."uid"())::"text" = "created_by"));



CREATE POLICY "app_ideas_delete_policy" ON "public"."app_ideas" FOR DELETE USING (((("auth"."uid"())::"text" = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."system_role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "app_ideas_insert_policy" ON "public"."app_ideas" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = "created_by"));



CREATE POLICY "app_ideas_select_policy" ON "public"."app_ideas" FOR SELECT USING (((("auth"."uid"())::"text" = "created_by") OR (("auth"."uid"())::"text" = "assigned_to") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."system_role" = 'admin'::"public"."user_role") OR (("profiles"."partner_id")::"text" = ANY (ARRAY["app_ideas"."created_by", "app_ideas"."assigned_to"]))))))));



CREATE POLICY "app_ideas_update_own_or_assigned" ON "public"."app_ideas" FOR UPDATE USING (((("auth"."uid"())::"text" = "created_by") OR (("auth"."uid"())::"text" = "assigned_to")));



CREATE POLICY "app_ideas_update_policy" ON "public"."app_ideas" FOR UPDATE USING (((("auth"."uid"())::"text" = "created_by") OR (("auth"."uid"())::"text" = "assigned_to") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."system_role" = 'admin'::"public"."user_role"))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_own" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_own_or_partner" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR ("auth"."uid"() = "partner_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."system_role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "profiles_update_own_or_admin" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."system_role" = 'admin'::"public"."user_role"))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";













































































































































































































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



























GRANT ALL ON TABLE "public"."app_ideas" TO "anon";
GRANT ALL ON TABLE "public"."app_ideas" TO "authenticated";
GRANT ALL ON TABLE "public"."app_ideas" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
