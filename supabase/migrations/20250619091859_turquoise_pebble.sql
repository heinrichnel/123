-- Create a table to log webhook events from Google Sheets
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Add a timeSpent field to the trips table to track delivery time
ALTER TABLE trips ADD COLUMN IF NOT EXISTS timeSpent TEXT;

-- Comment on the table and columns for documentation
COMMENT ON TABLE webhook_logs IS 'Logs of webhook events received from Google Sheets';
COMMENT ON COLUMN webhook_logs.event_type IS 'Type of event (shipped, delivered, ping)';
COMMENT ON COLUMN webhook_logs.payload IS 'The JSON payload received from the webhook';
COMMENT ON COLUMN webhook_logs.result IS 'The result of processing the webhook';
COMMENT ON COLUMN webhook_logs.created_at IS 'When the webhook was received';

COMMENT ON COLUMN trips.timeSpent IS 'Time spent between shipping and delivery';