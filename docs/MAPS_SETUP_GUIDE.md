# Google Maps Setup Guide 🗺️

## Quick Setup (2 minutes)

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Directions API**
   - **Geocoding API**

4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Configure Your App

Create a `.env` file in the root directory:

```bash
# Copy from .env.example
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
VITE_APP_NAME=GreenCommute
VITE_APP_URL=http://localhost:8080
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

### 3. Secure Your API Key (Recommended)

In Google Cloud Console:
1. Click on your API key
2. Under **API restrictions**, select:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

3. Under **Application restrictions**, add:
   - `localhost:8080`
   - Your production domain

### 4. Test the Map

1. Restart your dev server: `npm run dev`
2. Go to any ride details page
3. You should see an interactive map with the route!

## Using Free Tier

Google Maps offers **$200 free credit per month**, which includes:
- 28,000+ map loads
- 40,000+ geocoding requests
- 40,000+ directions requests

This is more than enough for development and small-scale apps!

## Features Now Available

✅ **Interactive Map** - Pan, zoom, and explore
✅ **Route Display** - Visual path from pickup to destination
✅ **Custom Markers** - Green for pickup (A), Red for destination (B)
✅ **Info Windows** - Click markers to see location details
✅ **Auto-Fit Bounds** - Map automatically adjusts to show full route
✅ **Distance & Duration** - Calculated in real-time

## Troubleshooting

### Map not showing?
1. Check browser console for errors
2. Verify API key is correct in `.env`
3. Ensure all required APIs are enabled
4. Restart dev server after changing `.env`

### "Loading map..." forever?
- Check your internet connection
- Verify API key permissions
- Check if billing is enabled (required even for free tier)

### Invalid address errors?
- The addresses from your rides must be valid
- Test with common locations first
- Use full addresses with city and country

## Alternative: Use Without API Key

If you don't want to set up Google Maps yet, the app will show a loading state with a message. You can still use all other features!

To remove the API key requirement entirely, you can modify the RouteMap component to show a static placeholder instead.
