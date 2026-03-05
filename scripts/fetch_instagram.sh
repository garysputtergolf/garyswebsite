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
echo "$response" | jq '{data: [.data | limit(4; .[])]}' > assets/instagram_feed.json

echo "Successfully wrote assets/instagram_feed.json"
