-- Create a table for driver behavior events if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_behavior_events (
  id TEXT PRIMARY KEY,
  driver_name TEXT NOT NULL,
  fleet_number TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  location TEXT,
  severity TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL,
  action_taken TEXT,
  points INTEGER NOT NULL,
  serial_number TEXT,
  latitude TEXT,
  longitude TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  car_report_id TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_behavior_events_driver ON driver_behavior_events(driver_name);
CREATE INDEX IF NOT EXISTS idx_driver_behavior_events_fleet ON driver_behavior_events(fleet_number);
CREATE INDEX IF NOT EXISTS idx_driver_behavior_events_date ON driver_behavior_events(date);
CREATE INDEX IF NOT EXISTS idx_driver_behavior_events_status ON driver_behavior_events(status);
CREATE INDEX IF NOT EXISTS idx_driver_behavior_events_severity ON driver_behavior_events(severity);

-- Add comments for documentation
COMMENT ON TABLE driver_behavior_events IS 'Driver behavior events from telematics systems or manual entry';
COMMENT ON COLUMN driver_behavior_events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN driver_behavior_events.driver_name IS 'Name of the driver';
COMMENT ON COLUMN driver_behavior_events.fleet_number IS 'Fleet number of the vehicle';
COMMENT ON COLUMN driver_behavior_events.event_date IS 'Date of the event (YYYY-MM-DD)';
COMMENT ON COLUMN driver_behavior_events.event_time IS 'Time of the event (HH:MM)';
COMMENT ON COLUMN driver_behavior_events.event_type IS 'Type of behavior event';
COMMENT ON COLUMN driver_behavior_events.description IS 'Description of the event';
COMMENT ON COLUMN driver_behavior_events.location IS 'Location of the event (lat,long or description)';
COMMENT ON COLUMN driver_behavior_events.severity IS 'Severity of the event (low, medium, high, critical)';
COMMENT ON COLUMN driver_behavior_events.reported_by IS 'Who reported the event';
COMMENT ON COLUMN driver_behavior_events.reported_at IS 'When the event was reported';
COMMENT ON COLUMN driver_behavior_events.status IS 'Status of the event (pending, acknowledged, resolved, disputed)';
COMMENT ON COLUMN driver_behavior_events.action_taken IS 'Action taken to address the behavior';
COMMENT ON COLUMN driver_behavior_events.points IS 'Demerit points for this event';
COMMENT ON COLUMN driver_behavior_events.serial_number IS 'Serial number of the telematics device';
COMMENT ON COLUMN driver_behavior_events.latitude IS 'Latitude where the event occurred';
COMMENT ON COLUMN driver_behavior_events.longitude IS 'Longitude where the event occurred';
COMMENT ON COLUMN driver_behavior_events.date IS 'Full timestamp of the event';
COMMENT ON COLUMN driver_behavior_events.resolved IS 'Whether the event has been resolved';
COMMENT ON COLUMN driver_behavior_events.resolved_at IS 'When the event was resolved';
COMMENT ON COLUMN driver_behavior_events.resolved_by IS 'Who resolved the event';
COMMENT ON COLUMN driver_behavior_events.car_report_id IS 'ID of associated Corrective Action Report';

-- Create a mapping table for fleet numbers to serial numbers
CREATE TABLE IF NOT EXISTS fleet_device_mapping (
  id SERIAL PRIMARY KEY,
  fleet_number TEXT NOT NULL UNIQUE,
  serial_number TEXT NOT NULL UNIQUE,
  device_type TEXT,
  installed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial mappings
INSERT INTO fleet_device_mapping (fleet_number, serial_number, device_type, installed_date)
VALUES 
  ('23H', '357660104031745', 'Telematics', '2025-01-01'),
  ('24H', '357660105416796', 'Telematics', '2025-01-01'),
  ('28H', '357660105442362', 'Telematics', '2025-01-01'),
  ('31H', '357660104031307', 'Telematics', '2025-01-01'),
  ('33H', '357660104031711', 'Telematics', '2025-01-01')
ON CONFLICT (fleet_number) DO NOTHING;

-- Create a mapping table for fleet numbers to drivers
CREATE TABLE IF NOT EXISTS fleet_driver_mapping (
  id SERIAL PRIMARY KEY,
  fleet_number TEXT NOT NULL UNIQUE,
  driver_name TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial mappings
INSERT INTO fleet_driver_mapping (fleet_number, driver_name, assigned_date)
VALUES 
  ('23H', 'Phillimon Kwarire', '2025-01-01'),
  ('24H', 'Taurayi Vherenaisi', '2025-01-01'),
  ('28H', 'Adrian Moyo', '2025-01-01'),
  ('31H', 'Enock Mukonyerwa', '2025-01-01'),
  ('33H', 'Canaan Chipfurutse', '2025-01-01')
ON CONFLICT (fleet_number) DO NOTHING;