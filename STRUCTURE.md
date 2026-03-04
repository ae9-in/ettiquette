# Project Structure

Root: copy-of-wokring-yes/copy-of-wokring-yes

Excludes: node_modules, .git, .vercel, dist

```text
.
├── api
│   └── [...path].ts
├── components
│   ├── GamificationFX.tsx
│   └── GamificationSystem.tsx
├── contexts
│   ├── AuthContext.mongodb.tsx
│   └── AuthContext.tsx
├── data
│   ├── courses
│   │   ├── ai_ethics_and_workplace_usage.ts
│   │   ├── anti_bribery_and_corruption_abc.ts
│   │   ├── business_ethics_and_integrity.ts
│   │   ├── data_privacy.ts
│   │   ├── diversity_and_inclusion.ts
│   │   ├── employee_code_of_conduct.ts
│   │   ├── fire_safety_and_evacuation.ts
│   │   ├── health_and_safety_ohs.ts
│   │   ├── information_security_awareness.ts
│   │   ├── legal_and_industrial_regulations.ts
│   │   ├── posh_prevention_of_sexual_harassment.ts
│   │   └── software_security_concerns.ts
│   ├── courses.ts
│   └── mockSession.ts
├── pages
│   ├── AdminDashboard.tsx
│   ├── Assessment.tsx
│   ├── Catalog.tsx
│   ├── CourseCompletion.tsx
│   ├── CourseContent.tsx
│   ├── CourseView.tsx
│   ├── Dashboard.tsx
│   ├── EmployeeDashboard.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── LoginPage.tsx
│   ├── PlatformAdminLogin.tsx
│   ├── Pricing.tsx
│   ├── UserAchievementsDashboard.tsx
│   └── UserDashboard.tsx
├── server
│   ├── api
│   │   ├── auth
│   │   │   ├── login.ts
│   │   │   ├── me.ts
│   │   │   └── register.ts
│   │   └── index.ts
│   ├── lib
│   │   ├── db.ts
│   │   └── env.ts
│   ├── middleware
│   │   ├── auth.ts
│   │   └── authMiddleware.ts
│   ├── .env
│   ├── .env.example
│   ├── .env.local
│   ├── .gitignore
│   ├── create-admin.ts
│   ├── index.ts
│   ├── migrate-complete-database.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── seed-database.ts
│   ├── test-admin-login.ts
│   ├── test-api-endpoints.ts
│   ├── test-atlas-connection.ts
│   ├── test-full-auth-flow.ts
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── verify-atlas.ts
│   └── verify-database.ts
├── src
│   ├── components
│   │   └── ProtectedRoute.tsx
│   ├── pages
│   │   └── PlatformAdminDashboard.tsx
│   └── config.ts
├── supabase
│   ├── .temp
│   │   ├── cli-latest
│   │   ├── gotrue-version
│   │   ├── pooler-url
│   │   ├── postgres-version
│   │   ├── project-ref
│   │   ├── rest-version
│   │   ├── storage-migration
│   │   └── storage-version
│   ├── functions
│   │   ├── admin-invite-user
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   ├── add_xp_column.sql
│   ├── assign_courses.sql
│   ├── check_policies.sql
│   ├── claim_profile_rpc.sql
│   ├── confirm_email.sql
│   ├── disable_rls_temp.sql
│   ├── fix_admin_user.sql
│   ├── fix_dashboard_access.sql
│   ├── fix_policies_definitive.sql
│   ├── fix_recursion.sql
│   ├── fix_rls_definitive.sql
│   ├── fix_rls_policies_v2.sql
│   ├── fix_user_roles_rls.sql
│   ├── force_rls_fix.sql
│   ├── link_admin_id.sql
│   ├── nuclear_rls_reset.sql
│   ├── reset_admin_user.sql
│   ├── reset_all_users.sql
│   ├── rls_fix.sql
│   ├── security_fixes.sql
│   ├── security_fixes_v2.sql
│   ├── seed_admin_role.sql
│   ├── seed_employee_role.sql
│   └── verify_admin_function.sql
├── systems
│   ├── api.ts
│   ├── appData.mongodb.ts
│   ├── appData.ts
│   ├── gamification.ts
│   └── mongodb.ts
├── .env
├── .env.local
├── .gitignore
├── ADMIN_LOGIN_FIX.md
├── ADMIN_LOGIN_GUIDE.txt
├── App.tsx
├── build_output.txt
├── COMPLETE_DATABASE_STRUCTURE.md
├── DATABASE_INJECTION_COMPLETE.md
├── DATABASE_SEEDED.md
├── DEBUG_LOGIN.md
├── deno.json
├── DEPLOYMENT_CHECKLIST.md
├── DEPLOYMENT_COMMANDS.md
├── FIXES_APPLIED.md
├── FRONTEND_DEPLOYMENT_FIX.md
├── index.css
├── index.html
├── index.tsx
├── JWT_DIAGNOSTIC_REPORT.md
├── LOADING_ISSUE_FIXED.md
├── metadata.json
├── MONGODB_CONNECTION_STATUS.md
├── MONGODB_MIGRATION.md
├── package.json
├── package-lock.json
├── postcss.config.cjs
├── QUICKSTART.md
├── QUICKSTART.txt
├── README.md
├── start.bat
├── start.ps1
├── start.sh
├── START_APP.md
├── STATUS_REPORT.md
├── tailwind.config.cjs
├── test_fetch.mjs
├── test-and-start.bat
├── test-functionality.js
├── test-login.html
├── tsconfig.json
├── types.ts
├── vercel.json
└── vite.config.ts
```
