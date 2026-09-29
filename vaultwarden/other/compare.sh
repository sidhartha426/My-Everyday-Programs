#!/bin/bash

# Check if exactly two arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <directory1> <directory2>"
    exit 1
fi

DIR1=$(realpath "$1")
DIR2=$(realpath "$2")

# Verify both directories exist
if [ ! -d "$DIR1" ] || [ ! -d "$DIR2" ]; then
    echo "Error: Both arguments must be valid directories."
    exit 1
fi

echo "Comparing files between:"
echo "Directory 1: $DIR1"
echo "Directory 2: $DIR2"
echo "------------------------------------------------"

# Track if any mismatches are found
mismatches=0

# Loop through all files in the first directory
cd "$DIR1" || exit 1
find . -type f | while read -r relative_path; do
    # Clean up the leading './' from the find command
    clean_path="${relative_path#./}"
    
    file1="$DIR1/$clean_path"
    file2="$DIR2/$clean_path"

    # Check if the file exists in the second directory
    if [ ! -f "$file2" ]; then
        echo "❌ [MISSING]  $clean_path (Not found in Directory 2)"
        mismatches=$((mismatches + 1))
        continue
    fi

    # Calculate SHA-256 hashes
    hash1=$(sha256sum "$file1" | awk '{print $1}')
    hash2=$(sha256sum "$file2" | awk '{print $1}')

    # Compare the hashes
    if [ "$hash1" = "$hash2" ]; then
        echo "✅ [MATCH]    $clean_path"
    else
        echo "🔺 [MISMATCH] $clean_path"
        mismatches=$((mismatches + 1))
    fi
done

# Optional: Check for files that exist in DIR2 but not in DIR1
cd "$DIR2" || exit 1
find . -type f | while read -r relative_path; do
    clean_path="${relative_path#./}"
    if [ ! -f "$DIR1/$clean_path" ]; then
        echo "❌ [EXTRA]    $clean_path (Found in Directory 2, but missing in Directory 1)"
    fi
done
