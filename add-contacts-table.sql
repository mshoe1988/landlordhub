-- Create contacts table for storing vendor and tenant contact information
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('tenant', 'vendor')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT, -- For vendors
  service_type TEXT, -- For vendors (plumber, HVAC, electrician, etc.)
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- For tenants
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_property_id ON contacts(property_id);

-- Enable RLS (Row Level Security)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE contacts IS 'Stores contact information for tenants and vendors';
COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: tenant or vendor';
COMMENT ON COLUMN contacts.service_type IS 'Type of service provided (for vendors): plumber, HVAC, electrician, lawn_care, real_estate_agent, etc.';
COMMENT ON COLUMN contacts.property_id IS 'Associated property (for tenants only)';









