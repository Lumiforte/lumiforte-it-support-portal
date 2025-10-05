-- Add company field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN company TEXT;

-- Add a check constraint for valid company values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_company_check CHECK (
  company IS NULL OR company IN (
    'Lumiforte EMEA SAS',
    'Lumiforte EMEA BV',
    'Lumiforte Holding BV',
    'Lumiforte Americas Ltd.',
    'Lumiforte Asia / Lumiray',
    'Sportlines GmbH',
    'Other / External'
  )
);