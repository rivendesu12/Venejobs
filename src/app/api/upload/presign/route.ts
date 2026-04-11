import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/auth';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
]);

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

interface PresignBody {
  conversationId?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PresignBody;
  try {
    body = (await req.json()) as PresignBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { conversationId, fileName, mimeType, sizeBytes } = body;

  if (!fileName || !mimeType || sizeBytes === undefined) {
    return NextResponse.json(
      { error: 'fileName, mimeType, and sizeBytes are required' },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `MIME type '${mimeType}' is not allowed` },
      { status: 400 },
    );
  }

  if (sizeBytes > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 400 });
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucketName = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  // Build a safe file key
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const randomId = crypto.randomUUID();
  const prefix = conversationId ? `uploads/${conversationId}/${randomId}` : `uploads/${randomId}`;
  const key = `${prefix}/${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

  return NextResponse.json({
    presignedUrl,
    publicUrl: `${publicUrl.replace(/\/$/, '')}/${key}`,
    key,
  });
}
