-- Add "waitlist" section to cms_homepage_sections JSONB array (after FAQ, before Contact CTA)
UPDATE cms_homepage_sections
SET sections = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'key' = 'contact_cta'
        THEN jsonb_set(elem, '{order}', to_jsonb((elem->>'order')::int + 1))
      ELSE elem
    END
    ORDER BY (elem->>'order')::int
  ) || jsonb_build_array(
    jsonb_build_object('key', 'waitlist', 'label', 'Early Access Waitlist', 'enabled', true, 'order', 12)
  )
  FROM jsonb_array_elements(sections) AS elem
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(sections) AS e WHERE e->>'key' = 'waitlist'
  )
)
WHERE id = 1
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(sections) AS e WHERE e->>'key' = 'waitlist'
  );
