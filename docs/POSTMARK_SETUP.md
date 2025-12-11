# Postmark API Setup - Quick Guide

## Your Postmark Credentials

- **Server API Token**: `bc9029fb-e5a1-45b9-a94e-11ee31e23a68` ✅
- **Account API Token**: `816bde41-495c-41be-8551-8726c069751c`

## Supabase Project Details

- **Project ID**: `kkdnnrwhzofttzajnwlj`
- **Supabase URL**: `https://kkdnnrwhzofttzajnwlj.supabase.co`

## Step 1: Set Environment Variables in Supabase

You need to set the Postmark API key as a secret in your Supabase Edge Function.

### Option A: Using Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Navigate to **Edge Functions** → **Settings** (or **Project Settings** → **Edge Functions**)
3. Find **Secrets** section
4. Add the following secrets:

```
POSTMARK_API_KEY=bc9029fb-e5a1-45b9-a94e-11ee31e23a68
POSTMARK_FROM_EMAIL=noreply@adiology.online
FRONTEND_URL=https://adiology.online
```

**Note**: Replace `noreply@adiology.online` with your verified sender email in Postmark.

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
# npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Set secrets
supabase secrets set POSTMARK_API_KEY=bc9029fb-e5a1-45b9-a94e-11ee31e23a68
supabase secrets set POSTMARK_FROM_EMAIL=noreply@adiology.online
supabase secrets set FRONTEND_URL=https://adiology.online
```

## Step 2: Verify Sender Email in Postmark

1. Go to Postmark Dashboard: https://account.postmarkapp.com
2. Navigate to **Sending** → **Signatures**
3. Add and verify your sender email (e.g., `noreply@adiology.online`)
4. Update `POSTMARK_FROM_EMAIL` in Supabase to match your verified sender

## Step 3: Test Email Functionality

### Using the Test Script

```bash
# Set environment variables
export SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZG5ucndoem9mdHR6YWpud2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njk2ODAsImV4cCI6MjA3OTA0NTY4MH0.IVIEaP0Stc0AieekxDFMG_q76vu6KRRMsI_yIjOfmZM

# Test email
node scripts/test-email.js your-email@example.com test

# Verification email
node scripts/test-email.js your-email@example.com verification

# Activation email
node scripts/test-email.js your-email@example.com activation
```

### Using cURL

```bash
# Test email
curl -X POST \
  https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/email/test \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZG5ucndoem9mdHR6YWpud2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njk2ODAsImV4cCI6MjA3OTA0NTY4MH0.IVIEaP0Stc0AieekxDFMG_q76vu6KRRMsI_yIjOfmZM" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

## Step 4: Verify It's Working

1. **Check Email Inbox**: Look for the test email (check spam folder)
2. **Check Postmark Dashboard**: Go to Activity → Messages to see sent emails
3. **Check Supabase Logs**: Go to Edge Functions → Logs to see function execution

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify sender email is verified in Postmark
- Check Postmark dashboard for bounce/spam reports

### API Errors
- Verify `POSTMARK_API_KEY` is set correctly in Supabase
- Check Edge Function logs for detailed error messages
- Ensure sender email matches verified email in Postmark

### "Email service not configured" Error
- Make sure you've set `POSTMARK_API_KEY` in Supabase secrets
- Redeploy Edge Function after setting secrets (if needed)
- Check Edge Function logs for configuration errors

## Security Note

⚠️ **Important**: Never commit API keys to version control. These keys are sensitive and should only be stored as environment variables/secrets in your hosting platform.

