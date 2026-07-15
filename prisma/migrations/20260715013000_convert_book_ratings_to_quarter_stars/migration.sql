-- Convert existing half-star ratings (1-10) to quarter-star ratings (1-20).
UPDATE "Book"
SET "rating" = "rating" * 2
WHERE "rating" IS NOT NULL;
