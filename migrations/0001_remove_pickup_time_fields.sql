-- Migration to remove pickupStartTime and pickupEndTime fields from food_posts table
ALTER TABLE food_posts 
DROP COLUMN IF EXISTS pickup_start_time,
DROP COLUMN IF EXISTS pickup_end_time;
