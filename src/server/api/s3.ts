import { S3Client } from "@aws-sdk/client-s3";
export const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_TOKEN ?? "",
  },
});
