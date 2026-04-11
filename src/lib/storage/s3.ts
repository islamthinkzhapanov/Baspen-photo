import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Env() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY env vars are required");
  }
  return { endpoint, accessKeyId, secretAccessKey };
}

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) {
    const { endpoint, accessKeyId, secretAccessKey } = getS3Env();
    _s3 = new S3Client({
      endpoint,
      region: process.env.S3_REGION || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return _s3;
}

let _s3Public: S3Client | null = null;
function getS3Public(): S3Client {
  if (!_s3Public) {
    const { endpoint, accessKeyId, secretAccessKey } = getS3Env();
    _s3Public = new S3Client({
      endpoint: process.env.S3_PUBLIC_ENDPOINT || endpoint,
      region: process.env.S3_REGION || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return _s3Public;
}

const bucket = process.env.S3_BUCKET || "baspen-photos";

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Public(), command, { expiresIn });
}

export async function getDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(getS3Public(), command, { expiresIn });
}

export async function deleteObject(key: string) {
  await getS3().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export function getPublicUrl(key: string) {
  return `${process.env.S3_PUBLIC_URL}/${key}`;
}

export { getS3 as s3, getS3Public as s3Public, bucket };
