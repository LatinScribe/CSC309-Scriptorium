#!/bin/bash

# Startup script
npx prisma generate
npx prisma migrate dev

sqlite3 prisma/dev.db

# username: SUDOMASTER
# password: SUDOMaSTER123$$$
# Hashed password: $2b$10$rMBi0flXfzj5CM.b48pHxOZTdwAUdg7CyVcRcbEy3xOw1zcdouPe2
# Salt: $2b$04$Dj4CSejxfO4vg4yvYN6LPe
# Email: SUDOMASTER@MASTER.com

INSERT INTO User(username, password, salt, email, role)
VALUES('SUDOMASTER', '$2b$10$rMBi0flXfzj5CM.b48pHxOZTdwAUdg7CyVcRcbEy3xOw1zcdouPe2', '$2b$04$Dj4CSejxfO4vg4yvYN6LPe', 'SUDOMASTER@MASTER.com', 'ADMIN');