-- Create a table to track processed driver behavior events by row ID
CREATE TABLE IF NOT EXISTS processed_driver_events (
  id SERIAL PRIMARY KEY,
  row_id INTEGER NOT NULL UNIQUE,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_driver_events_row_id ON processed_driver_events(row_id);

-- Add row_id column to driver_behavior_events table if it doesn't exist
ALTER TABLE driver_behavior_events ADD COLUMN IF NOT EXISTS row_id INTEGER;

-- Comment on the table and columns for documentation
COMMENT ON TABLE processed_driver_events IS 'Tracks which rows from Google Sheets have been processed';
COMMENT ON COLUMN processed_driver_events.row_id IS 'The row ID from the Google Sheet';
COMMENT ON COLUMN processed_driver_events.processed_at IS 'When the row was processed';
COMMENT ON COLUMN driver_behavior_events.row_id IS 'The row ID from the Google Sheet';