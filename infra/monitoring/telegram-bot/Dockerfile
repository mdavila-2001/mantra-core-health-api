# slim (glibc) y no alpine: matplotlib publica ruedas manylinux, en musl tendría
# que compilarse con toolchain completo dentro de la imagen.
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends tzdata wget \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --no-create-home --uid 10001 bot
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY bot/ /app/bot/
USER bot
# matplotlib necesita un directorio de caché escribible para el usuario sin home.
ENV PYTHONUNBUFFERED=1 MPLCONFIGDIR=/tmp/matplotlib
EXPOSE 9200
CMD ["python", "-m", "bot.main"]
