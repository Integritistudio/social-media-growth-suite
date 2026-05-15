-- Fix: "Got a packet bigger than 'max_allowed_packet' bytes"
-- Base64 images in saved posts exceed the default limit on many local installs (e.g. 4MB).
--
-- Option A — persists across restarts (recommended): edit my.ini / my.cnf under [mysqld]:
--   max_allowed_packet=64M
-- Then restart the MySQL service.
--
-- Option B — until next restart (run as a user with SUPER or SYSTEM_VARIABLES_ADMIN):
SET GLOBAL max_allowed_packet = 67108864;
