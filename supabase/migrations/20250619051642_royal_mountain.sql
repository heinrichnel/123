-- Create a table to track Google Sheets synchronization state
CREATE TABLE IF NOT EXISTS sheet_sync_state (
  id SERIAL PRIMARY KEY,
  sheet_name TEXT NOT NULL UNIQUE,
  last_processed_row INTEGER NOT NULL DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert initial records for the two sheets we'll be tracking
INSERT INTO sheet_sync_state (sheet_name, last_processed_row) 
VALUES 
  ('Order.Shipped', 219), -- Start from row 219 as specified
  ('Order.Delivered', 736) -- Start from row 736 as specified
ON CONFLICT (sheet_name) DO NOTHING;

-- Create a table to store trip status updates
CREATE TABLE IF NOT EXISTS trip_status_updates (
  id SERIAL PRIMARY KEY,
  trip_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('shipped', 'delivered')),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  google_sheet_row INTEGER,
  google_sheet_name TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trip_status_updates_trip_id ON trip_status_updates(trip_id);