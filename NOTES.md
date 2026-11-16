# Manual Steps to Finalize Phase 1 & 2

1. Install backend security dependencies:
   `cd backend && npm install express-rate-limit helmet bcryptjs jsonwebtoken cors pg dotenv`

2. Rotate Neon Database password in Vercel. 
   Set Vercel Environment Variables:
   - `DATABASE_URL=postgresql://USER:NEW_PASSWORD@HOST/dbname?sslmode=require`
   - `JWT_SECRET=<generate_a_long_random_string>`
   - `FRONTEND_URL=https://aldhow-camps.vercel.app`
   - `ADMIN_EMAIL=yourname@aldhow.com`
   - `ADMIN_PASSWORD=<min_12_characters>`

3. Remove the old credential from git history:
   (In the project root, assuming BFG repo cleaner is installed)
   `bfg --replace-text replacements.txt` (where replacements.txt contains your old Neon DB password)
   `git reflog expire --expire=now --all && git gc --prune=now --aggressive`
   `git push origin --force --all`

4. Run the seed script against Neon DB:
   `cd backend`
   `node scripts/seed.js`
   *(This will create the schema and the initial Super Admin account securely).*