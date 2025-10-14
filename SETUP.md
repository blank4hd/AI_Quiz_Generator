# Quiz Generator - Setup Guide

## Fix for "Unexpected end of JSON input" Error

This error occurs when the Supabase functions are not running or not properly configured. Follow these steps:

### 1. Start Supabase Locally

Make sure you have Supabase CLI installed and running:

```bash
# Start Supabase
supabase start
```

This will start the local Supabase instance on `http://127.0.0.1:54321`

### 2. Set Environment Variables

The Supabase function needs your Google Gemini API key:

```bash
# Set the API key in your Supabase secrets
supabase secrets set GOOGLE_GEMINI_API_KEY=your-api-key-here
```

Or add it to your `supabase/config.toml` file (for local development only):

```toml
[functions.gemini-generate.env]
GOOGLE_GEMINI_API_KEY = "your-api-key-here"
```

### 3. Deploy the Function

Deploy the Gemini function:

```bash
# Deploy the function locally
supabase functions deploy gemini-generate --no-verify-jwt
```

### 4. Start the Dev Server

```bash
# Install dependencies if not already done
bun install

# Start the development server
bun run dev
```

### 5. Test the Upload

Now try uploading a file. The proxy configuration in `vite.config.ts` will forward requests from `/functions/v1/gemini-generate` to `http://127.0.0.1:54321/functions/v1/gemini-generate`.

## Troubleshooting

### Check if Supabase is running:
```bash
supabase status
```

### Check function logs:
```bash
supabase functions logs gemini-generate
```

### Test the function directly:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/gemini-generate' \
  --header 'Content-Type: application/json' \
  --data '{"content":"Test content","type":"generate","options":{"count":1}}'
```

### Common Issues:

1. **Supabase not running**: Make sure `supabase start` was executed successfully
2. **Missing API key**: Ensure GOOGLE_GEMINI_API_KEY is set
3. **Function not deployed**: Run `supabase functions deploy gemini-generate`
4. **Port conflict**: Check if port 54321 is available

## For Production Deployment

When deploying to production, update the proxy target in `vite.config.ts` or use environment variables:

```typescript
proxy: {
  '/functions/v1': {
    target: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    changeOrigin: true,
    secure: false,
  },
}
```
