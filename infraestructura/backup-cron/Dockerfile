FROM google/cloud-sdk:slim

RUN apt-get update && apt-get install -y \
    default-mysql-client \
    postgresql-client \
    gzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backup.sh /app/backup.sh

RUN chmod +x /app/backup.sh

CMD ["/app/backup.sh"]