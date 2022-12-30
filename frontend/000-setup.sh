#!/usr/bin/env sh
if [ -z "$GATEWAY_BASE_URL" ]; then
  echo "ERROR: Environment variable GATEWAY_GATEWAY_BASE_URL is not set!"
  exit 1
fi

if [ "$INCLUDE_V1" = "true" ] || [ "$INCLUDE_V1" = "t" ]; then # Note: this line is actually correct, is POSIX syntax (https://github.com/koalaman/shellcheck/wiki/SC2039)
  CONFIG_FILE="/etc/nginx/conf.d/gateway.conf"
  CONFIG_START=$(more "$CONFIG_FILE" | grep --line-number "### BEGIN V1 CONFIG ###" | cut --delimiter ':' --fields 1)
  CONFIG_END=$(more "$CONFIG_FILE" | grep --line-number "### END V1 CONFIG ###" | cut --delimiter ':' --fields 1)

  UNCOMMENT_START=$((CONFIG_START + 1))
  UNCOMMENT_END=$((CONFIG_END - 1))
  sed -i "$UNCOMMENT_START,$UNCOMMENT_END s/^\(\s*\)#/\1/g" "$CONFIG_FILE" # remove all comments
fi

find /var/www/html/webmock -not -type d -exec sed -i "s|https://test.benjaminguzman.dev|$GATEWAY_BASE_URL|g" {} +
