-- One-time migration: disable photo sales for all existing projects
-- Sets freeDownload=true, watermarkEnabled=false, pricePerPhoto=0, packageDiscount=0
-- Run this on production after deploying the code changes

UPDATE events
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{freeDownload}', 'true'
      ),
      '{watermarkEnabled}', 'false'
    ),
    '{pricePerPhoto}', '0'
  ),
  '{packageDiscount}', '0'
);
