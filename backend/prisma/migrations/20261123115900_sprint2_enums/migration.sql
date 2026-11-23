-- New enum values must be committed before they can be used as defaults (next migration)
ALTER TYPE "DocumentType" ADD VALUE 'RC_BOOK';
ALTER TYPE "VerificationStatus" ADD VALUE 'PROFILE_INCOMPLETE';
