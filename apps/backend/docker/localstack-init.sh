#!/bin/sh
# Tạo bucket và mở quyền đọc công khai, giống cách cấu hình R2 cho ảnh sản phẩm.
awslocal s3 mb s3://socks-media
awslocal s3api put-bucket-policy --bucket socks-media --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::socks-media/*"
  }]
}'
# CORS cho phép trình duyệt PUT thẳng lên, đúng thứ R2 cũng cần.
awslocal s3api put-bucket-cors --bucket socks-media --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }]
}'
