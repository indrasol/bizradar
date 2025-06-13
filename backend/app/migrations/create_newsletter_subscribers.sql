-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- Add RLS policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for subscription)
CREATE POLICY "Allow public subscription" ON newsletter_subscribers
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow users to read their own subscription
CREATE POLICY "Allow users to read own subscription" ON newsletter_subscribers
    FOR SELECT TO authenticated
    USING (email = auth.jwt()->>'email');

-- Allow admins to read all subscriptions
CREATE POLICY "Allow admins to read all subscriptions" ON newsletter_subscribers
    FOR SELECT TO authenticated
    USING (auth.jwt()->>'role' = 'admin');

-- Allow admins to update subscriptions
CREATE POLICY "Allow admins to update subscriptions" ON newsletter_subscribers
    FOR UPDATE TO authenticated
    USING (auth.jwt()->>'role' = 'admin');

-- Allow admins to delete subscriptions
CREATE POLICY "Allow admins to delete subscriptions" ON newsletter_subscribers
    FOR DELETE TO authenticated
    USING (auth.jwt()->>'role' = 'admin'); 