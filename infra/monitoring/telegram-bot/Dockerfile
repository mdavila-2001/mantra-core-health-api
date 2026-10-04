FROM python:3.12-alpine
# tzdata: el resumen diario se programa en hora de La Paz.
RUN apk add --no-cache tzdata && adduser -D -H -u 10001 bot
WORKDIR /app
COPY bot/ /app/bot/
USER bot
ENV PYTHONUNBUFFERED=1
EXPOSE 9200
CMD ["python", "-m", "bot.main"]
