FROM python:3.12-alpine
WORKDIR /app
COPY server.py ./
COPY static ./static
ENV BUDGET_DB=/data/budget.db BUDGET_HOST=0.0.0.0 BUDGET_PORT=8080 PYTHONUNBUFFERED=1
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["python", "server.py"]
