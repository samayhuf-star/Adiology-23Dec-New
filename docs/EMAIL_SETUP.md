# Email Setup with Postmark

This document explains how to set up and test email functionality using Postmark for activation and verification emails.

## Prerequisites

1. **Postmark Account**: Sign up at [postmarkapp.com](https://postmarkapp.com)
2. **Postmark API Key**: Get your Server API Token from Postmark dashboard
3. **Verified Sender**: Add and verify a sender email address in Postmark

## Environment Variables

Add the following environment variables to your Supabase Edge Function:

### Required Variables

```bash
POSTMARK_API_KEY=your-postmark-server-api-token
POSTMARK_FROM_EMAIL=noreply@adiology.online  # Must be verified in Postmark
FRONTEND_URL=https://adiology.online  # Your frontend URL
```

### Setting Environment Variables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings**
3. Add the environment variables under **Secrets**

Or use the Supabase CLI:

```bash
supabase secrets set POSTMARK_API_KEY=your-api-key
supabase secrets set POSTMARK_FROM_EMAIL=noreply@adiology.online
supabase secrets set FRONTEND_URL=https://adiology.online
```

## API Endpoints

### 1. Send Verification Email

**Endpoint:** `POST /make-server-6757d0ca/email/send-verification`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "verification_token_here",
  "baseUrl": "https://adiology.online"  // Optional, defaults to FRONTEND_URL
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "postmark-message-id",
  "message": "Verification email sent successfully"
}
```

### 2. Send Activation Email

**Endpoint:** `POST /make-server-6757d0ca/email/send-activation`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "activation_token_here",
  "baseUrl": "https://adiology.online"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "postmark-message-id",
  "message": "Activation email sent successfully"
}
```

### 3. Test Email

**Endpoint:** `POST /make-server-6757d0ca/email/test`

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "postmark-message-id",
  "message": "Test email sent successfully"
}
```

## Testing

### Using the Test Script

1. Set environment variables:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
```

2. Run the test script:
```bash
# Test email
node scripts/test-email.js test@example.com test

# Verification email
node scripts/test-email.js test@example.com verification

# Activation email
node scripts/test-email.js test@example.com activation
```

### Using cURL

```bash
# Test email
curl -X POST \
  https://your-project.supabase.co/functions/v1/make-server-6757d0ca/email/test \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Verification email
curl -X POST \
  https://your-project.supabase.co/functions/v1/make-server-6757d0ca/email/send-verification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "token": "verify_1234567890_abc123",
    "baseUrl": "https://adiology.online"
  }'
```

### Testing in the Frontend

1. **Sign Up Flow:**
   - Go to the signup page
   - Fill in the form and submit
   - The verification email will be sent automatically via Postmark
   - Check your email inbox for the verification link

2. **Resend Verification:**
   - Go to the email verification page
   - Click "Resend Verification Email"
   - Check your email inbox

## Email Templates

The email templates are HTML-formatted and include:

- **Verification Email**: Contains a verification button and link
- **Activation Email**: Contains an activation button and link
- **Test Email**: Simple test message

Templates are styled with:
- Gradient header with Adiology branding
- Responsive design
- Clear call-to-action buttons
- Fallback text version

## Troubleshooting

### Email Not Received

1. **Check Spam Folder**: Emails might be filtered to spam
2. **Verify Postmark Configuration**: Ensure API key and sender email are correct
3. **Check Postmark Dashboard**: View email logs and delivery status
4. **Verify Sender Domain**: Ensure sender email is verified in Postmark

### API Errors

1. **401 Unauthorized**: Check your Supabase anon key
2. **500 Internal Server Error**: 
   - Verify `POSTMARK_API_KEY` is set correctly
   - Check Postmark API key permissions
   - Review Edge Function logs in Supabase dashboard

3. **Email Service Not Configured**:
   - Ensure `POSTMARK_API_KEY` environment variable is set
   - Redeploy the Edge Function after setting secrets

### Common Issues

**Issue**: `POSTMARK_API_KEY is not configured`
- **Solution**: Set the environment variable in Supabase Edge Function settings

**Issue**: `Invalid sender signature`
- **Solution**: Verify the sender email address in Postmark dashboard

**Issue**: Emails going to spam
- **Solution**: 
  - Set up SPF/DKIM records for your domain in Postmark
  - Use a verified sender domain
  - Avoid spam trigger words in subject/content

## Postmark Limits

- **Free Tier**: 100 emails/month
- **Paid Plans**: Varies by plan
- Check your Postmark dashboard for current usage

## Monitoring

Monitor email delivery in:
1. **Postmark Dashboard**: View delivery status, bounces, opens
2. **Supabase Edge Function Logs**: Check for errors or issues
3. **Application Logs**: Monitor API calls and responses

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys periodically
- Monitor for unusual email sending patterns
- Implement rate limiting for email endpoints

## Support

For Postmark-specific issues:
- [Postmark Documentation](https://postmarkapp.com/developer)
- [Postmark Support](https://postmarkapp.com/support)

For application-specific issues:
- Check Edge Function logs in Supabase dashboard
- Review application error tracking

