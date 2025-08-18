-- Enable Row Level Security for daily_reports table
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow all users to read daily reports
CREATE POLICY "daily_reports_select_policy" ON daily_reports
    FOR SELECT
    USING (true);

-- Policy for INSERT: Only allow service_role to insert
CREATE POLICY "daily_reports_insert_policy" ON daily_reports
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy for UPDATE: Only allow service_role to update
CREATE POLICY "daily_reports_update_policy" ON daily_reports
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy for DELETE: Only allow service_role to delete
CREATE POLICY "daily_reports_delete_policy" ON daily_reports
    FOR DELETE
    USING (auth.role() = 'service_role');

-- Grant necessary permissions to service_role
GRANT ALL ON daily_reports TO service_role;
GRANT USAGE ON SEQUENCE daily_reports_id_seq TO service_role;

-- Grant read permissions to anon and authenticated users
GRANT SELECT ON daily_reports TO anon;
GRANT SELECT ON daily_reports TO authenticated;