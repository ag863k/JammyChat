# Frontend Dockerfile
FROM node:20
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
WORKDIR /app/frontend
EXPOSE 3000
CMD ["npm", "start"]
