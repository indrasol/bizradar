-- Test script to verify the trigger is working
-- This is a temporary migration for testing purposes

-- Test the trigger function manually (uncomment to test)
-- DO $$
-- DECLARE
--     test_user_id UUID;
--     test_metadata JSONB;
-- BEGIN
--     -- Create test metadata
--     test_metadata := '{"first_name": "Test", "last_name": "User"}'::jsonb;
--     
--     -- Test the function directly
--     SELECT public.handle_new_user() INTO test_user_id;
--     
--     RAISE NOTICE 'Trigger function test completed successfully';
-- EXCEPTION
--     WHEN OTHERS THEN
--         RAISE NOTICE 'Trigger function test failed: %', SQLERRM;
-- END $$;

-- Check if profiles table exists and has correct structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Profiles table exists';
        
        -- Check if trigger exists
        IF EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        ) THEN
            RAISE NOTICE 'Trigger on_auth_user_created exists';
        ELSE
            RAISE NOTICE 'Trigger on_auth_user_created does NOT exist';
        END IF;
        
        -- Check if function exists
        IF EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user' 
            AND routine_schema = 'public'
        ) THEN
            RAISE NOTICE 'Function handle_new_user exists';
        ELSE
            RAISE NOTICE 'Function handle_new_user does NOT exist';
        END IF;
        
    ELSE
        RAISE NOTICE 'Profiles table does NOT exist';
    END IF;
END $$;
