-- Add branding columns to property_manager
ALTER TABLE property_manager ADD COLUMN IF NOT EXISTS colore_secondario text;
ALTER TABLE property_manager ADD COLUMN IF NOT EXISTS font_titoli text DEFAULT 'Inter';
ALTER TABLE property_manager ADD COLUMN IF NOT EXISTS font_corpo text DEFAULT 'Inter';

-- Create storage bucket for logos (run in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
