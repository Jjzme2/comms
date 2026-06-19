import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ key: string; contentType: string }>(event)

  if (!body?.key || !body?.contentType) {
    throw createError({ statusCode: 400, message: 'key and contentType are required' })
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: config.r2Endpoint,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  const command = new PutObjectCommand({
    Bucket: config.r2BucketName,
    Key: body.key,
    ContentType: body.contentType,
  })

  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { url }
})
