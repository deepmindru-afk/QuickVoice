import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const BUCKET = process.env.S3_BUCKET_NAME ?? "";

/**
 * Generate a presigned download URL for an existing S3 object.
 * Default expiry: 1 hour (3600s).
 */
export const generateDownloadUrl = async (
  key: string,
  expiresIn = 3600
): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};

/**
 * Generate a presigned upload URL so the client can PUT directly to S3.
 * Default expiry: 15 minutes (900s).
 */
export const generateUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
};
