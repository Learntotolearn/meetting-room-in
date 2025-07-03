FROM golang:1.24.3-alpine AS builder
WORKDIR /app

# 先复制依赖文件并下载依赖，利用缓存
COPY go.mod go.sum ./
RUN go mod download

# 再复制代码
COPY . .
RUN apk add --no-cache gcc musl-dev
ENV CGO_ENABLED=1
RUN go build -o server main.go

# 运行阶段
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
ENV GIN_MODE=release
EXPOSE 80
CMD ["./server"] 