-- SQL script to remove pickup_start_time and pickup_end_time columns from the food_posts table
ALTER TABLE food_posts 
DROP COLUMN IF EXISTS pickup_start_time,
DROP COLUMN IF EXISTS pickup_end_time;
