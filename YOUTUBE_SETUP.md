# YouTube Transcript Feature Setup

The Quiz Generator supports two methods for extracting YouTube video transcripts. Choose the one that best fits your needs.

## 📋 Quick Comparison

| Feature            | Google YouTube Data API | Python API     |
| ------------------ | ----------------------- | -------------- |
| **Setup Required** | Google Cloud setup      | None           |
| **API Key**        | Required                | Not required   |
| **Cost**           | Free (10,000 units/day) | Free           |
| **Reliability**    | More reliable           | May be blocked |
| **Best For**       | Production use          | Quick testing  |

---

## Method 1: Google YouTube Data API v3 (Recommended)

### ✅ Advantages

- **More reliable** - Official Google API
- **Better for production** - Stable and documented
- **Can use same API key** - If you already have Gemini API key
- **Higher success rate** - Works with most videos

### ⚠️ Limitations

- **Requires setup** - Must enable API in Google Cloud Console
- **API key needed** - Free but requires Google account
- **Quota limits** - 10,000 units per day (usually sufficient)

### � Setup Instructions

#### Step 1: Enable YouTube Data API v3

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/

2. **Select or Create a Project**

   - Use the same project as your Gemini API key

3. **Enable YouTube Data API v3**

   - Go to: https://console.cloud.google.com/apis/library/youtube.googleapis.com
   - Click **"ENABLE"**
   - Wait for it to activate (usually instant)

4. **Get Your API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Your existing Gemini API key should work for YouTube API
   - Or create a new API key if needed

#### Step 2: Use in Quiz Generator

1. Select **"Google YouTube Data API"** in the UI
2. Enter your Google API key (same as Gemini key if properly configured)
3. Paste your YouTube URL
4. Click **"Generate Quiz from Video"**

### 🔒 Security Note

Your API key is only sent to the backend server and never stored in the browser.

### 💡 API Key Tips

- **Reuse your Gemini key**: If YouTube Data API v3 is enabled in your project, your Gemini API key works for YouTube too
- **Restrict your key**: In Google Cloud Console, you can restrict the key to only specific APIs
- **Monitor usage**: Check API usage at https://console.cloud.google.com/apis/dashboard

---

## Method 2: Python API (Alternative)

### ✅ Advantages

- **No setup required** - Works immediately
- **No API key needed** - Completely free
- **Simple** - Just paste the YouTube URL
- **Good for testing** - Quick way to try the feature

### ⚠️ Limitations

- May be blocked by YouTube for bot detection
- Some videos might not work
- Less reliable for automated/batch processing
- No official support

### 📚 Implementation

This method uses the open-source [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) library.

### 🚀 How to Use

1. Select **"Python API (Alternative)"** in the UI
2. Paste your YouTube URL
3. Click **"Generate Quiz from Video"**

### 🛠️ Technical Details

- Implemented in `youtube-service/app.py` (Flask microservice)
- Runs on port 5001
- No authentication required
- Supports multiple languages with fallback

---

## 🆚 Which Method Should You Choose?

### Use Google API (Recommended) if:

- ✅ You need reliable transcript extraction
- ✅ You're building a production application
- ✅ You already have Google Cloud setup
- ✅ You need to process many videos
- ✅ You want official API support

### Use Python API if:

- ✅ You want to test the feature quickly
- ✅ You don't want to set up Google Cloud
- ✅ You're processing single videos occasionally
- ✅ You're okay with occasional failures

---

## 🛠️ Troubleshooting

### Python API Issues

**Error: "Failed to fetch transcript"**

- Video may not have captions/subtitles enabled
- Video might be region-restricted
- YouTube may have blocked the request
- **Solution**: Try the Google API method or a different video

**Error: "Transcript data is empty"**

- Video has disabled transcripts
- **Solution**: Choose a video with captions enabled

### Google API Issues

**Error: "YouTube Data API access denied"**

- API is not enabled in Google Cloud Console
- **Solution**: Visit https://console.cloud.google.com/apis/library/youtube.googleapis.com and enable it

**Error: "Invalid API key"**

- API key is incorrect or expired
- YouTube Data API v3 is not enabled for this key
- **Solution**: Check your API key and ensure YouTube API is enabled

**Error: "Quota exceeded"**

- You've reached the daily quota limit (10,000 units/day)
- **Solution**: Wait until tomorrow or request quota increase

---

## 📊 API Quota Information

### YouTube Data API v3 Costs

- **List videos**: 1 unit per request
- **List captions**: 50 units per request
- **Daily quota**: 10,000 units (free tier)

### Example Usage

- ~196 video transcript requests per day (with quota)
- More than enough for typical use cases

---

## 🔗 Useful Links

- **Python API GitHub**: https://github.com/jdepoix/youtube-transcript-api
- **YouTube Data API Documentation**: https://developers.google.com/youtube/v3
- **Enable YouTube API**: https://console.cloud.google.com/apis/library/youtube.googleapis.com
- **API Credentials**: https://console.cloud.google.com/apis/credentials
- **API Dashboard**: https://console.cloud.google.com/apis/dashboard

---

## 💡 Pro Tips

1. **Start with Python API**: Test the feature first before setting up Google Cloud
2. **Use Google API for production**: Once you're happy with the feature, switch to Google API
3. **Keep your API key secure**: Never commit it to version control
4. **Monitor your quota**: Check usage if processing many videos
5. **Test with educational videos**: They usually have good transcripts

---

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for error messages
2. Review Docker logs: `docker-compose logs youtube-service`
3. Try a different video with known captions
4. Switch between methods to identify the issue
5. Check if the video has captions enabled on YouTube

---

**Note**: This feature requires videos to have captions/subtitles enabled. Videos without captions cannot be processed regardless of the method used.
