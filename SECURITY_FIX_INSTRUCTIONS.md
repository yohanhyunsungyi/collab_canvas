# 🔒 Security Fix Instructions

## ⚠️ CRITICAL: OpenAI API Key Exposure

Your OpenAI API key was exposed in the production build. Follow these steps **immediately** to secure your application.

---

## ✅ STEP 1: Revoke the Exposed API Key (DO THIS NOW!)

1. Go to [OpenAI Platform API Keys](https://platform.openai.com/api-keys)
2. Find this key: `sk-proj-ZzYbFNrp...` (starts with sk-proj)
3. Click **Delete** or **Revoke** on that key
4. Confirm deletion

**Why:** The key is publicly accessible in your deployed site. Anyone can use it to make API calls on your account.

---

## ✅ STEP 2: Create a New API Key

1. Still on [OpenAI Platform API Keys](https://platform.openai.com/api-keys)
2. Click **"+ Create new secret key"**
3. Name it: `CollabCanvas-Backend`
4. Set permissions: **All** (or limit to what you need)
5. Click **Create**
6. **COPY THE KEY IMMEDIATELY** (you won't see it again!)
7. Save it temporarily in a secure location (we'll use it in Step 5)

---

## ✅ STEP 3: Install Functions Dependencies

```bash
cd /Users/yohanyi/Desktop/GauntletAI/01_CollabCanvas

# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Go back to project root
cd ..
```

---

## ✅ STEP 4: Configure Firebase Functions with API Key

Store the new API key securely in Firebase Functions config:

```bash
# Set the OpenAI API key in Firebase Functions config
firebase functions:config:set openai.key="YOUR_NEW_API_KEY_HERE"

# Verify it's set
firebase functions:config:get
```

Replace `YOUR_NEW_API_KEY_HERE` with the key you copied in Step 2.

**Important:** This stores the key on Firebase servers, not in your code!

---

## ✅ STEP 5: Deploy Cloud Functions

```bash
# Deploy functions to Firebase
firebase deploy --only functions

# This will:
# 1. Build the TypeScript functions
# 2. Upload them to Firebase
# 3. Make them available at secure HTTPS endpoints
```

**Wait for deployment to complete.** You should see:
```
✔  functions: Finished running predeploy script.
✔  functions[processAICommand(us-central1)]: Successful create operation.
✔  functions[analyzeDesign(us-central1)]: Successful create operation.
✔  Deploy complete!
```

---

## ✅ STEP 6: Remove Old Dist Folder & Rebuild

```bash
# Remove the old build with exposed key
rm -rf dist

# Build the new version (uses Cloud Functions)
npm run build

# The new build will call Cloud Functions instead of OpenAI directly
```

---

## ✅ STEP 7: Deploy to Firebase Hosting

```bash
# Deploy the new secure build
firebase deploy --only hosting

# This uploads the new build without any API keys
```

---

## ✅ STEP 8: Verify Security

1. Visit your deployed site: https://gauntlet-collabcanvas-7d9d7.web.app
2. Open **Developer Tools** → **Network** tab
3. Try an AI command (e.g., "Create a red circle")
4. You should see requests to:
   - `https://us-central1-gauntlet-collabcanvas-7d9d7.cloudfunctions.net/processAICommand`
   
5. **NO requests to** `api.openai.com` should appear!

6. Check the JavaScript bundle:
   ```bash
   # Search for API keys in the new build
   grep -r "sk-proj-" dist/
   grep -r "sk-[a-zA-Z0-9]" dist/
   ```
   
   Both should return **NO RESULTS** ✅

---

## 📋 What Changed?

### Architecture Before (❌ Insecure):
```
Browser → OpenAI API (with exposed key)
```

### Architecture After (✅ Secure):
```
Browser → Firebase Cloud Functions → OpenAI API (secure key)
         (authenticated)           (key stored on server)
```

### Files Created:
- `functions/` - New directory for Cloud Functions
- `functions/src/index.ts` - AI processing functions
- `functions/package.json` - Functions dependencies
- `functions/tsconfig.json` - TypeScript config
- `src/services/ai-cloud.service.ts` - Client service for Cloud Functions
- `src/services/ai-suggestions-cloud.service.ts` - Design suggestions via Cloud Functions

### Files Modified:
- `firebase.json` - Added functions configuration
- `src/hooks/useAI.ts` - Now calls Cloud Functions
- `src/components/AI/AISuggestions.tsx` - Uses new cloud service

---

## 🧪 Testing

Test that everything works:

```bash
# 1. Test AI Commands
- Sign in to your deployed site
- Type: "Create a red circle"
- Should work normally

# 2. Test Design Suggestions
- Create some shapes
- Click the sparkle button
- Click "Analyze"
- Should receive suggestions

# 3. Check Browser Console
- Should see NO errors about API keys
- Should see Cloud Function calls
```

---

## 🎯 Cost & Usage Monitoring

### Monitor OpenAI Usage:
1. Visit [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. Set up usage alerts
3. Monitor daily/monthly costs

### Monitor Firebase Functions:
1. Visit [Firebase Console](https://console.firebase.google.com/project/gauntlet-collabcanvas-7d9d7/functions)
2. Check function invocations
3. Monitor errors and execution times

---

## 🚨 If Something Goes Wrong

### Functions Not Deploying:
```bash
# Check for errors
npm --prefix functions run build

# Check Firebase CLI version
firebase --version

# Update if needed
npm install -g firebase-tools
```

### AI Commands Not Working:
```bash
# Verify API key is set
firebase functions:config:get

# Check function logs
firebase functions:log

# Redeploy functions
firebase deploy --only functions --force
```

### Still Seeing Old API Key:
```bash
# Clear browser cache completely
# Or test in incognito mode

# Verify you rebuilt:
rm -rf dist
npm run build
firebase deploy --only hosting
```

---

## ✨ Additional Security Improvements

Consider implementing (optional):

1. **Rate Limiting per User**
   - Already implemented in `ai-cloud.service.ts`
   - Limits: 10 requests per minute per user

2. **Usage Quotas**
   - Track usage per user in Firestore
   - Implement monthly limits

3. **Cost Alerts**
   - Set up OpenAI billing alerts
   - Monitor Firebase Functions usage

4. **Authentication Requirements**
   - Already implemented (functions check `context.auth`)
   - Only authenticated users can use AI

---

## 📞 Need Help?

If you encounter issues:

1. Check [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
2. Check [OpenAI API Documentation](https://platform.openai.com/docs)
3. Review function logs: `firebase functions:log`
4. Check browser console for errors

---

## ✅ Completion Checklist

- [ ] Revoked old API key on OpenAI Platform
- [ ] Created new API key
- [ ] Installed functions dependencies (`cd functions && npm install`)
- [ ] Set API key in Firebase config (`firebase functions:config:set`)
- [ ] Deployed Cloud Functions (`firebase deploy --only functions`)
- [ ] Removed old dist folder (`rm -rf dist`)
- [ ] Built new version (`npm run build`)
- [ ] Deployed to hosting (`firebase deploy --only hosting`)
- [ ] Tested AI commands work
- [ ] Verified no API keys in dist folder
- [ ] Confirmed requests go to Cloud Functions

---

**Status:** Once all checkboxes are complete, your application is secure! 🎉

