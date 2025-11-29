-- ============================================
-- PRODUCTION SERVER MIGRATION SCRIPT
-- Charity ID Migration: INT -> VARCHAR(8)
-- ============================================
-- 
-- This script migrates charities and charity_slides tables to use
-- random 8-character unique IDs instead of auto-increment integers.
-- 
-- IMPORTANT: Run this script on the production database BEFORE
-- deploying the new server code.
-- 
-- Generated: 2024-11-29
-- ============================================

-- Step 1: Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Add temporary new_id columns
ALTER TABLE charities ADD COLUMN new_id VARCHAR(8);
ALTER TABLE charities ADD COLUMN display_order INT DEFAULT 0;
ALTER TABLE charity_slides ADD COLUMN new_id VARCHAR(8);
ALTER TABLE charity_slides ADD COLUMN new_charity_id VARCHAR(8);

-- Step 3: Update charities with new unique IDs
UPDATE charities SET new_id = 'atrngkt2', display_order = 1, img = 'atrngkt2' WHERE id = 1;
UPDATE charities SET new_id = '4fnbpmhl', display_order = 2, img = '4fnbpmhl' WHERE id = 2;
UPDATE charities SET new_id = 'tkzwp7n8', display_order = 3, img = 'tkzwp7n8' WHERE id = 3;
UPDATE charities SET new_id = '7asxh4cp', display_order = 4, img = '7asxh4cp' WHERE id = 4;
UPDATE charities SET new_id = 'l3ohc4tc', display_order = 5, img = 'l3ohc4tc' WHERE id = 5;

-- Step 4: Update charity_slides with new unique IDs
UPDATE charity_slides SET new_id = 'xuodvd7d', new_charity_id = 'atrngkt2', display_order = 1, img = 'xuodvd7d' WHERE id = 1;
UPDATE charity_slides SET new_id = 'q7vy1ei3', new_charity_id = 'atrngkt2', display_order = 2, img = 'q7vy1ei3' WHERE id = 2;
UPDATE charity_slides SET new_id = 'bd2onbbv', new_charity_id = '4fnbpmhl', display_order = 11, img = 'bd2onbbv' WHERE id = 3;
UPDATE charity_slides SET new_id = 'drwxffgx', new_charity_id = '4fnbpmhl', display_order = 4, img = 'drwxffgx' WHERE id = 4;
UPDATE charity_slides SET new_id = '10pvx1co', new_charity_id = '4fnbpmhl', display_order = 19, img = '10pvx1co' WHERE id = 5;
UPDATE charity_slides SET new_id = '59ez5lbe', new_charity_id = '4fnbpmhl', display_order = 17, img = '59ez5lbe' WHERE id = 6;
UPDATE charity_slides SET new_id = 'le1d41io', new_charity_id = '4fnbpmhl', display_order = 18, img = 'le1d41io' WHERE id = 7;
UPDATE charity_slides SET new_id = '3xerrcv1', new_charity_id = '4fnbpmhl', display_order = 9, img = '3xerrcv1' WHERE id = 8;
UPDATE charity_slides SET new_id = 'll0dpvdz', new_charity_id = '4fnbpmhl', display_order = 3, img = 'll0dpvdz' WHERE id = 9;
UPDATE charity_slides SET new_id = 'xxtl6hn2', new_charity_id = '4fnbpmhl', display_order = 8, img = 'xxtl6hn2' WHERE id = 10;
UPDATE charity_slides SET new_id = 'vjwij4jj', new_charity_id = '4fnbpmhl', display_order = 7, img = 'vjwij4jj' WHERE id = 11;
UPDATE charity_slides SET new_id = '8plf5dpb', new_charity_id = '4fnbpmhl', display_order = 12, img = '8plf5dpb' WHERE id = 12;
UPDATE charity_slides SET new_id = 'o6yaniuc', new_charity_id = '4fnbpmhl', display_order = 10, img = 'o6yaniuc' WHERE id = 13;
UPDATE charity_slides SET new_id = 'wr0q0nxz', new_charity_id = '4fnbpmhl', display_order = 14, img = 'wr0q0nxz' WHERE id = 14;
UPDATE charity_slides SET new_id = 'ipf72e8p', new_charity_id = '4fnbpmhl', display_order = 6, img = 'ipf72e8p' WHERE id = 15;
UPDATE charity_slides SET new_id = 'wdk61e3s', new_charity_id = '4fnbpmhl', display_order = 13, img = 'wdk61e3s' WHERE id = 16;
UPDATE charity_slides SET new_id = 'dr8rybtw', new_charity_id = '4fnbpmhl', display_order = 1, img = 'dr8rybtw' WHERE id = 17;
UPDATE charity_slides SET new_id = 'qy0k6f87', new_charity_id = '4fnbpmhl', display_order = 16, img = 'qy0k6f87' WHERE id = 18;
UPDATE charity_slides SET new_id = 'uzzwwad1', new_charity_id = '4fnbpmhl', display_order = 2, img = 'uzzwwad1' WHERE id = 19;
UPDATE charity_slides SET new_id = 'l2di3pnv', new_charity_id = '4fnbpmhl', display_order = 5, img = 'l2di3pnv' WHERE id = 20;
UPDATE charity_slides SET new_id = 'szyo1h20', new_charity_id = '4fnbpmhl', display_order = 15, img = 'szyo1h20' WHERE id = 21;
UPDATE charity_slides SET new_id = 'fit9sod6', new_charity_id = 'tkzwp7n8', display_order = 7, img = 'fit9sod6' WHERE id = 22;
UPDATE charity_slides SET new_id = '0kwzvs8v', new_charity_id = 'tkzwp7n8', display_order = 6, img = '0kwzvs8v' WHERE id = 23;
UPDATE charity_slides SET new_id = 'sg1j816q', new_charity_id = 'tkzwp7n8', display_order = 8, img = 'sg1j816q' WHERE id = 24;
UPDATE charity_slides SET new_id = 'ooyssy24', new_charity_id = 'tkzwp7n8', display_order = 10, img = 'ooyssy24' WHERE id = 25;
UPDATE charity_slides SET new_id = 'ruzu1fls', new_charity_id = 'tkzwp7n8', display_order = 9, img = 'ruzu1fls' WHERE id = 26;
UPDATE charity_slides SET new_id = 'fqja51b1', new_charity_id = 'tkzwp7n8', display_order = 3, img = 'fqja51b1' WHERE id = 27;
UPDATE charity_slides SET new_id = 'add7eke9', new_charity_id = 'tkzwp7n8', display_order = 2, img = 'add7eke9' WHERE id = 28;
UPDATE charity_slides SET new_id = 'jf5pcqft', new_charity_id = 'tkzwp7n8', display_order = 4, img = 'jf5pcqft' WHERE id = 29;
UPDATE charity_slides SET new_id = 'xfmjnoie', new_charity_id = 'tkzwp7n8', display_order = 11, img = 'xfmjnoie' WHERE id = 30;
UPDATE charity_slides SET new_id = '063wy7mk', new_charity_id = 'tkzwp7n8', display_order = 5, img = '063wy7mk' WHERE id = 31;
UPDATE charity_slides SET new_id = '7aszvjtq', new_charity_id = 'tkzwp7n8', display_order = 1, img = '7aszvjtq' WHERE id = 33;

-- Step 5: Drop foreign key constraint
ALTER TABLE charity_slides DROP FOREIGN KEY fk_charity_slide_charity;

-- Step 6: Drop old primary keys and modify columns
-- First remove AUTO_INCREMENT before dropping primary key
ALTER TABLE charities MODIFY COLUMN id INT NOT NULL;
ALTER TABLE charities DROP PRIMARY KEY;
ALTER TABLE charities DROP COLUMN id;
ALTER TABLE charities CHANGE new_id id VARCHAR(8) NOT NULL;
ALTER TABLE charities ADD PRIMARY KEY (id);

ALTER TABLE charity_slides MODIFY COLUMN id INT NOT NULL;
ALTER TABLE charity_slides DROP PRIMARY KEY;
ALTER TABLE charity_slides DROP COLUMN id;
ALTER TABLE charity_slides DROP COLUMN charity_id;
ALTER TABLE charity_slides CHANGE new_id id VARCHAR(8) NOT NULL;
ALTER TABLE charity_slides CHANGE new_charity_id charity_id VARCHAR(8) NOT NULL;
ALTER TABLE charity_slides ADD PRIMARY KEY (id);

-- Step 7: Re-add foreign key constraint
ALTER TABLE charity_slides ADD CONSTRAINT fk_charity_slide_charity FOREIGN KEY (charity_id) REFERENCES charities(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 'Charities:' as '';
SELECT id, title, display_order FROM charities ORDER BY display_order;

SELECT 'Charity Slides:' as '';
SELECT id, charity_id, display_order FROM charity_slides ORDER BY charity_id, display_order;
