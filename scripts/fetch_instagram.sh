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

# Extract the 'data' array and filter out any irrelevant fields or format it nicely
# and limit to the top 4 posts
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

# Save JSON without media_url and thumbnail_url so it doesn't change on every run
echo "$response" | jq '{data: [.data | limit(4; .[]) | del(.media_url, .thumbnail_url)]}' > assets/instagram_feed.json

echo "Successfully wrote assets/instagram_feed.json"
