// Simple server-side route to add invites. In production, protect this with
// a server-side admin check against the Firebase Admin SDK.
// For bootstrapping: call once manually or via an admin UI.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; secret: string }>(event)
  const config = useRuntimeConfig()

  // Require a shared secret to prevent unauthenticated access
  if (body.secret !== (config as any).inviteSecret) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (!body.email) throw createError({ statusCode: 400, message: 'email required' })

  // Invite doc is written to Firestore from the client-side admin panel instead.
  // This route serves as a programmatic fallback.
  return { ok: true, message: `Invite for ${body.email} should be written to Firestore invites/${body.email.toLowerCase()}` }
})
