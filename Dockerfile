# Stage 1: Build Frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
# Use Taobao mirror for NPM
RUN npm config set registry https://registry.npmmirror.com
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Stage 2: Build Backend
FROM maven:3.9.6-eclipse-temurin-21 AS backend-builder
WORKDIR /app/backend
# Create settings.xml with Aliyun mirror
RUN echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" \
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
    xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd"> \
    <mirrors> \
        <mirror> \
            <id>aliyunmaven</id> \
            <mirrorOf>*</mirrorOf> \
            <name>Aliyun Public Mirror</name> \
            <url>https://maven.aliyun.com/repository/public</url> \
        </mirror> \
    </mirrors> \
</settings>' > /app/settings.xml

COPY backend/pom.xml ./
# Download dependencies to cache them, using the settings.xml
RUN mvn -s /app/settings.xml dependency:go-offline -B
COPY backend/src ./src
# Copy built frontend assets to backend static resources
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static
# Build the application, using the settings.xml
RUN mvn -s /app/settings.xml clean package -DskipTests

# Stage 3: Runtime
FROM nginx:alpine

# Install Java 21
RUN apk add --no-cache openjdk21

WORKDIR /app

# Copy backend jar
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Copy frontend static files to Nginx root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports (80 for Nginx, 8080 for Backend)
EXPOSE 80 8080

# Set environment variables
ENV SERVER_PORT=8080
ENV TZ=Asia/Shanghai

# Run startup script
ENTRYPOINT ["/app/start.sh"]

