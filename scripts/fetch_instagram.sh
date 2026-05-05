#!/bin/bash

# Fetch the latest media from Instagram using the Graph API
# The secrets are passed in as environment variables

if [ -z "$INSTAGRAMACCESSTOKEN" ]; then
  echo "Error: INSTAGRAMACCESSTOKEN is not set"
  exit 1
fi

echo "Fetching Instagram feed..."
response=$(curl -s "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&access_token=${INSTAGRAMACCESSTOKEN}")

# Check if curl failed
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch from Instagram API"
  exit 1
fi

# Check if the response contains an error
error=$(echo "$response" | jq -r '.error.message // empty')
if [ ! -z "$error" ]; then
  echo "Instagram API Error: $error"
  exit 1
fi

# Generate the new JSON payload to a temporary file
TMP_JSON=$(mktemp)
echo "$response" | jq '{data: [.data | limit(4; .[]) | del(.media_url, .thumbnail_url)]}' > "$TMP_JSON"

# If the JSON precisely matches what we already have, exit gracefully without touching binaries!
if [ -f "assets/instagram_feed.json" ] && cmp -s "$TMP_JSON" assets/instagram_feed.json; then
  echo "No new Instagram posts detected. Exiting gracefully without updates."
  rm "$TMP_JSON"
  exit 0
fi

# The feed has changed! Overwrite the old JSON and proceed to wipe and download new imagery
mv "$TMP_JSON" assets/instagram_feed.json

mkdir -p assets/ig_media

# Clear out any past images before storing the latest 4 to save space
rm -f assets/ig_media/*

# Download images
echo "$response" | jq -c '.data | limit(4; .[])' | while read -r post; do
  id=$(echo "$post" | jq -r '.id')
  media_type=$(echo "$post" | jq -r '.media_type')
  if [ "$media_type" = "VIDEO" ]; then
    url=$(echo "$post" | jq -r '.thumbnail_url')
  else
    url=$(echo "$post" | jq -r '.media_url')
  fi
  # Download and save as id.jpg
  curl -s -o "assets/ig_media/${id}.jpg" "$url"
done

echo "Successfully wrote assets/instagram_feed.json"

# --- Token Renewal Section ---
# Instagram long-lived tokens expire after 60 days. 
# They can be refreshed if they are at least 24 hours old.
# We automate this here to keep the token alive indefinitely.

if [ -n "$GH_TOKEN" ]; then
  echo "Attempting to refresh Instagram access token..."
  
  # Fetch the refreshed token
  RESPONSE=$(curl -s -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=$INSTAGRAMACCESSTOKEN")

  # Extract the new token using jq
  NEW_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')

  # Check if we got a valid token back before overwriting
  if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
    # Use GitHub CLI to update the secret
    # GITHUB_REPOSITORY is automatically set by GitHub Actions
    echo "$NEW_TOKEN" | gh secret set INSTAGRAMACCESSTOKEN --repo "$GITHUB_REPOSITORY"
    echo "Successfully refreshed and updated the Instagram access token secret."
  else
    # If it's not time to refresh yet, Instagram returns an error or the same token.
    # We don't want to fail the whole script, so we just log it.
    echo "Token renewal skipped or failed. Response: $RESPONSE"
  fi
else
  echo "GH_TOKEN not set. Skipping token renewal step."
fi
