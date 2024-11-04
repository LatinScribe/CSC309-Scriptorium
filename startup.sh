#!/bin/bash

# Startup script
echo installing dependencies...
npm i

echo setting up database...
npx prisma generate
npx prisma migrate dev --name init

# username: SUDOMASTER
# password: SUDOMaSTER123$$$
# Hashed password: $2b$10$rMBi0flXfzj5CM.b48pHxOZTdwAUdg7CyVcRcbEy3xOw1zcdouPe2
# Salt: $2b$04$Dj4CSejxfO4vg4yvYN6LPe
# Email: SUDOMASTER@MASTER.com

sqlite3 prisma/dev.db <<EOF
INSERT OR IGNORE INTO User(username, password, salt, email, role)
VALUES('SUDOMASTER', '\$2b\$10\$rMBi0flXfzj5CM.b48pHxOZTdwAUdg7CyVcRcbEy3xOw1zcdouPe2', '\$2b\$04\$Dj4CSejxfO4vg4yvYN6LPe', 'SUDOMASTER@MASTER.com', 'ADMIN');
EOF
echo checking if any compilers are missing...
[ -x "python" ] && echo "Command 'python' not found" 
[ -x "java" ] && echo "Command 'java' not found" 
[ -x "gcc" ] && echo "Command 'gcc' not found" 
[ -x "node" ] && echo "Command 'node' not found" 
[ -x "g++" ] && echo "Command 'g++' not found" 
echo Done! If you see no "Command not found" message, then all compilers are present

# npm run dev

# recommended to run test suite for checking
# in a new terminal
# npx jest