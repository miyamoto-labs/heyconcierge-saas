#!/bin/bash
# Weather Forecast - Uses free Open-Meteo API (no key needed)
set -euo pipefail

CITY="${1:?Usage: ./weather.sh <city>}"

# Geocode city name
GEO=$(curl -sf "https://geocoding-api.open-meteo.com/v1/search?name=$(printf '%s' "$CITY" | jq -sRr @uri)&count=1")
LAT=$(echo "$GEO" | jq -r '.results[0].latitude // empty')
LON=$(echo "$GEO" | jq -r '.results[0].longitude // empty')
NAME=$(echo "$GEO" | jq -r '.results[0].name // empty')
COUNTRY=$(echo "$GEO" | jq -r '.results[0].country // empty')

if [ -z "$LAT" ]; then
  echo "Error: City '$CITY' not found"
  exit 1
fi

# Fetch weather
WEATHER=$(curl -sf "https://api.open-meteo.com/v1/forecast?latitude=$LAT&longitude=$LON&current=temperature_2m,wind_speed_10m,weather_code&temperature_unit=celsius")

TEMP=$(echo "$WEATHER" | jq -r '.current.temperature_2m')
WIND=$(echo "$WEATHER" | jq -r '.current.wind_speed_10m')
CODE=$(echo "$WEATHER" | jq -r '.current.weather_code')

# Decode weather code to description
case "$CODE" in
  0) DESC="Clear sky" ;;
  1|2|3) DESC="Partly cloudy" ;;
  45|48) DESC="Foggy" ;;
  51|53|55) DESC="Drizzle" ;;
  61|63|65) DESC="Rain" ;;
  71|73|75) DESC="Snow" ;;
  80|81|82) DESC="Rain showers" ;;
  95|96|99) DESC="Thunderstorm" ;;
  *) DESC="Unknown ($CODE)" ;;
esac

echo "📍 $NAME, $COUNTRY"
echo "🌡️  ${TEMP}°C"
echo "💨 ${WIND} km/h"
echo "☁️  $DESC"
