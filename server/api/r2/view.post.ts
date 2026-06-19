import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ key: string }>(event)

  if (!body?.key) {
    throw createError({ statusCode: 400, message: 'key is required' })
  }

  // If a public URL is configured, just return that directly
  if (config.public.r2PublicUrl) {
    return { url: `${config.public.r2PublicUrl}/${body.key}` }
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: config.r2Endpoint,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  const command = new GetObjectCommand({
    Bucket: config.r2BucketName,
    Key: body.key,
  })

  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { url }
})
