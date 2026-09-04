-- AlterEnum
BEGIN;
CREATE TYPE "ActivityAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE');
ALTER TABLE "ActivityLog" ALTER COLUMN "action" TYPE "ActivityAction_new" USING ("action"::text::"ActivityAction_new");
ALTER TYPE "ActivityAction" RENAME TO "ActivityAction_old";
ALTER TYPE "ActivityAction_new" RENAME TO "ActivityAction";
DROP TYPE "public"."ActivityAction_old";
COMMIT;
