#!/bin/bash

# Startup script
npx prisma generate
npx prisma migrate dev --name init

# username: SUDOMASTER
# password: SUDOMaSTER123$$$
# Hashed password: $2b$10$rMBi0flXfzj5CM.b48pHxOZTdwAUdg7CyVcRcbEy3xOw1zcdouPe2
# Salt: $2b$04$Dj4CSejxfO4vg4yvYN6LPe
# Email: SUDOMASTER@MASTER.com

sqlite3 prisma/dev.db <<EOF
INSERT OR IGNORE INTO User(username, password, salt, email, role)
VALUES('SUDOMASTER', '$2b$10$rMBi0flXfzj5CM.b48pHxOZTdwAUdg7CyVcRcbEy3xOw1zcdouPe2', '$2b$04$Dj4CSejxfO4vg4yvYN6LPe', 'SUDOMASTER@MASTER.com', 'ADMIN');
EOF


# npm run dev

# recommended to run test suite for checking
# in a new terminal
# npx jest