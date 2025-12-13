# GoDaddy India → Vercel Domain Setup

## Quick Setup Guide for sonaai.in

### Part 1: Vercel Dashboard (5 minutes)

1. **Go to Vercel**
   - Visit: https://vercel.com/dashboard
   - Select your project: `stock-analysis-app`

2. **Add Domain**
   - Click **Settings** tab
   - Click **Domains** in sidebar
   - Enter: `sonaai.in` → Click **Add**
   - Enter: `www.sonaai.in` → Click **Add**

3. **Note the DNS Instructions**
   - Vercel will show you what DNS records to add
   - Keep this page open for reference

---

### Part 2: GoDaddy India Setup (10 minutes)

#### Step 1: Login to GoDaddy India
- Go to: https://dcc.godaddy.com
- Login with your GoDaddy credentials

#### Step 2: Access DNS Management
1. Click on **My Products** or **Domains**
2. Find `sonaai.in` in your domain list
3. Click the **DNS** button next to it
   - Or click the domain name → **Manage DNS**

#### Step 3: Configure DNS Records

You'll see a list of DNS records. Here's what to do:

##### A. Update A Record (for sonaai.in)

**If an A record with Name "@" exists:**
1. Click the **pencil icon** (edit) next to it
2. Change **Points to** value to: `76.76.21.21`
3. Set **TTL** to: `600 seconds` or `Custom: 600`
4. Click **Save**

**If no A record exists:**
1. Click **Add** button
2. Select **Type**: `A`
3. **Name**: `@`
4. **Value** (Points to): `76.76.21.21`
5. **TTL**: `600 seconds`
6. Click **Save**

##### B. Add CNAME Record (for www.sonaai.in)

1. Click **Add** button (or **Add Record**)
2. Select **Type**: `CNAME`
3. **Name**: `www`
4. **Value** (Points to): `cname.vercel-dns.com`
5. **TTL**: `1 Hour` (or 3600 seconds)
6. Click **Save**

#### Step 4: Remove Conflicting Records (Important!)

**Check for and remove:**
- Any A record pointing to GoDaddy parking page (usually `160.153.x.x` or similar)
- Any CNAME record for `@` (root domain can't have CNAME)
- Any conflicting A records for `www`

**Keep these records (DO NOT DELETE):**
- MX records (for email)
- TXT records (for email verification, SPF, DKIM)
- Any other CNAME records you're using (like for email)

#### Step 5: Final DNS Configuration

Your DNS records should look like this:

```
Type    Name    Value                   TTL
----    ----    -----                   ---
A       @       76.76.21.21            600
CNAME   www     cname.vercel-dns.com   3600
```

Plus any existing MX, TXT records for email (keep those).

---

### Part 3: Verification (Wait 10 mins - 24 hours)

#### Check Vercel Dashboard
1. Go back to Vercel → Settings → Domains
2. Wait for status to change to **"Valid Configuration"**
3. You'll see a green checkmark when ready

#### Test Your Domain
```bash
# Check if DNS is propagated
dig sonaai.in

# Should show:
# sonaai.in.  600  IN  A  76.76.21.21
```

#### Visit Your Site
- Open browser and go to: `https://sonaai.in`
- May show SSL warning initially (normal)
- Vercel will auto-provision SSL certificate within 1 hour

---

## GoDaddy India Specific Tips

### DNS Propagation Time
- **GoDaddy India**: Usually 10-30 minutes for Indian users
- **Global**: Can take up to 24-48 hours
- **TTL 600**: Means changes propagate faster (10 minutes)

### Common GoDaddy Issues

**Issue 1: "Record already exists"**
- Solution: Edit the existing record instead of adding new one

**Issue 2: "Invalid CNAME value"**
- Solution: Make sure you're using `cname.vercel-dns.com` (not your project URL)
- Don't add `https://` or trailing `/`

**Issue 3: Domain still shows GoDaddy parking page**
- Solution: Wait longer (up to 24 hours)
- Clear browser cache: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Try incognito/private browsing mode

**Issue 4: SSL Certificate Error**
- Solution: Vercel needs valid DNS first
- SSL auto-provisions after DNS is correct
- Can take 1-2 hours after DNS propagates

### Email Configuration (If using email)

If you're using email with sonaai.in (like contact@sonaai.in):

**DO NOT DELETE these records:**
- MX records (mail exchange)
- TXT records (SPF, DKIM, DMARC)
- Any CNAME for email services

**These are separate from website hosting and must be preserved!**

---

## Troubleshooting Commands

### Check DNS from your computer:

```bash
# Check A record
nslookup sonaai.in

# Check CNAME for www
nslookup www.sonaai.in

# Detailed DNS info (Mac/Linux)
dig sonaai.in
dig www.sonaai.in
```

### Check DNS Propagation Globally:
- Visit: https://www.whatsmydns.net
- Enter: `sonaai.in`
- Select: `A` record
- Should show: `76.76.21.21` globally

---

## Expected Timeline

| Time | Status |
|------|--------|
| 0 min | DNS records added in GoDaddy |
| 10-30 min | DNS propagates in India |
| 1-2 hours | DNS propagates globally |
| 1-2 hours | Vercel provisions SSL certificate |
| 2-4 hours | **Everything working!** ✅ |

---

## Final Checklist

- [ ] Added `sonaai.in` in Vercel dashboard
- [ ] Added `www.sonaai.in` in Vercel dashboard
- [ ] Added A record in GoDaddy: `@ → 76.76.21.21`
- [ ] Added CNAME record in GoDaddy: `www → cname.vercel-dns.com`
- [ ] Removed conflicting/parking page records
- [ ] Kept MX and email-related records (if applicable)
- [ ] Waited at least 30 minutes
- [ ] Checked Vercel dashboard for "Valid Configuration"
- [ ] Tested `https://sonaai.in` in browser
- [ ] SSL certificate showing as secure 🔒

---

## Support

**GoDaddy India Support:**
- Phone: 1800-102-8888 (Toll-free)
- Chat: Available in GoDaddy dashboard

**Vercel Support:**
- Documentation: https://vercel.com/docs/concepts/projects/custom-domains
- Support: https://vercel.com/support

---

**Domain**: sonaai.in  
**Registrar**: GoDaddy India  
**Hosting**: Vercel  
**Setup Date**: December 13, 2025
