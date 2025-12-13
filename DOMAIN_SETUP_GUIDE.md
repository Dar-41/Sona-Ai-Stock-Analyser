# Domain Setup Guide: sonaai.in → Vercel

## Overview
This guide will help you connect your custom domain `sonaai.in` to your Vercel-deployed stock analysis application.

## Step-by-Step Instructions

### Step 1: Add Domain in Vercel

1. **Login to Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Navigate to your project dashboard

2. **Access Domain Settings**
   - Click on your project (stock-analysis-app)
   - Go to **Settings** tab
   - Click on **Domains** in the left sidebar

3. **Add Your Domain**
   - Enter `sonaai.in` in the domain input field
   - Click **Add**
   - Optionally, also add `www.sonaai.in` for the www subdomain

### Step 2: Configure DNS Records

You have two options for DNS configuration:

#### Option A: Using Vercel Nameservers (Recommended ✅)

This is the easiest and most reliable method:

1. **Get Vercel Nameservers**
   - After adding the domain, Vercel will show you nameservers
   - Typically: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`

2. **Update Nameservers at Your Registrar**
   - Login to your domain registrar (where you bought sonaai.in)
   - Find DNS/Nameserver settings
   - Replace existing nameservers with Vercel's nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - Save changes

3. **Wait for Propagation**
   - DNS changes can take 24-48 hours to propagate
   - Usually completes within a few hours

#### Option B: Using A and CNAME Records

If you want to keep your current nameservers:

1. **For Root Domain (sonaai.in)**
   - Type: `A`
   - Name: `@` (or leave blank)
   - Value: `76.76.21.21`
   - TTL: `3600` (or default)

2. **For WWW Subdomain (www.sonaai.in)**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `3600` (or default)

3. **Additional Configuration (if needed)**
   - Vercel may provide a specific CNAME value for your project
   - Check the Vercel dashboard for the exact value

### Step 3: Verify Domain Configuration

1. **Check Vercel Dashboard**
   - Go back to Settings → Domains
   - You should see your domain with a status indicator
   - Wait for "Valid Configuration" status

2. **Test Your Domain**
   - Once configured, visit `https://sonaai.in`
   - Vercel automatically provisions SSL certificates
   - Your site should load with HTTPS

### Step 4: Set Primary Domain (Optional)

1. In Vercel's Domain settings, you can set which domain is primary
2. Click the three dots next to your domain
3. Select "Set as Primary Domain"
4. This will redirect all other domains to your primary domain

## Common Domain Registrars

### For GoDaddy:
1. Go to DNS Management
2. Update Nameservers or add A/CNAME records
3. Save changes

### For Namecheap:
1. Go to Domain List → Manage
2. Click "Advanced DNS" tab
3. Add/update records or change nameservers

### For Google Domains:
1. Go to DNS settings
2. Use Custom name servers or Custom resource records
3. Add the required records

### For Hostinger/BigRock (Common in India):
1. Login to control panel
2. Find DNS Zone Editor or Nameservers
3. Update as per instructions above

## Troubleshooting

### Domain Not Working After 24 Hours?

1. **Check DNS Propagation**
   - Use [whatsmydns.net](https://www.whatsmydns.net)
   - Enter `sonaai.in` and check A record globally

2. **Verify DNS Records**
   - Use `dig sonaai.in` (Mac/Linux) or `nslookup sonaai.in` (Windows)
   - Should point to Vercel's IP or nameservers

3. **Check Vercel Status**
   - Ensure domain shows "Valid Configuration" in Vercel
   - Check for any error messages

4. **Clear DNS Cache**
   ```bash
   # On Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # On Windows
   ipconfig /flushdns
   ```

### SSL Certificate Issues?

- Vercel automatically provisions SSL certificates
- This happens after DNS is properly configured
- Can take a few minutes to a few hours
- Check Vercel dashboard for SSL status

## Verification Commands

Run these commands to verify your DNS setup:

```bash
# Check A record
dig sonaai.in A

# Check CNAME record for www
dig www.sonaai.in CNAME

# Check nameservers
dig sonaai.in NS

# Alternative using nslookup
nslookup sonaai.in
```

## Expected Results

Once everything is configured correctly:

✅ `https://sonaai.in` → Your Vercel app  
✅ `https://www.sonaai.in` → Your Vercel app (if configured)  
✅ SSL certificate automatically applied  
✅ HTTP automatically redirects to HTTPS  

## Additional Resources

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/custom-domains)
- [DNS Propagation Checker](https://www.whatsmydns.net)
- [Vercel Support](https://vercel.com/support)

## Notes

- **Propagation Time**: DNS changes typically take 1-24 hours, sometimes up to 48 hours
- **SSL Certificates**: Automatically provisioned by Vercel via Let's Encrypt
- **Email**: If you use email with your domain, make sure to preserve MX records
- **Subdomains**: You can add multiple subdomains (e.g., `api.sonaai.in`, `blog.sonaai.in`)

---

**Last Updated**: December 13, 2025  
**Domain**: sonaai.in  
**Hosting**: Vercel  
**Project**: Stock Analysis App (SonaAI)
