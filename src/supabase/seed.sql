-- Connect Supabase SQL Editor → Run ALL
-- Enable PostGIS first: CREATE EXTENSION postgis;

-- 1. Areas (Top Karachi Landmarks)
INSERT INTO areas (name, coordinates, category) VALUES
('Near KU (University Road)', ST_PointFromText('POINT(67.1194 24.9533)', 4326), 'University'),
('Near Lucky One Mall', ST_PointFromText('POINT(67.2000 24.9167)', 4326), 'Mall'),
('Near IBA University Road', ST_PointFromText('POINT(67.1069 24.9092)', 4326), 'University'),
('Near Millennium Mall', ST_PointFromText('POINT(67.0786 24.8611)', 4326), 'Mall'),
('Near NIPA Chowrangi', ST_PointFromText('POINT(67.1428 24.9125)', 4326), 'Transport');

-- Add 70 more landmarks (Phase 1 has TOP 25)