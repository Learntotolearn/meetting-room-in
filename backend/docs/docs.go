// Package docs Code generated by swaggo/swag. DO NOT EDIT
package docs

import "github.com/swaggo/swag"

const docTemplate = `{
    "schemes": {{ marshal .Schemes }},
    "swagger": "2.0",
    "info": {
        "description": "{{escape .Description}}",
        "title": "{{.Title}}",
        "contact": {},
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {
        "/api/admin/bookings": {
            "get": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "管理员查询所有用户的预订记录",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "管理员"
                ],
                "summary": "(Admin) 查询所有预订",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/auth/sso": {
            "post": {
                "description": "根据外部信息自动注册或登录用户",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "用户"
                ],
                "summary": "单点登录",
                "parameters": [
                    {
                        "description": "SSO参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.SSORequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/bookings": {
            "get": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "查询所有会议室的预订记录",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "预订"
                ],
                "summary": "查询所有预订",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "会议室ID",
                        "name": "room_id",
                        "in": "query"
                    },
                    {
                        "type": "string",
                        "description": "开始时间(ISO8601)",
                        "name": "start_time",
                        "in": "query"
                    },
                    {
                        "type": "string",
                        "description": "结束时间(ISO8601)",
                        "name": "end_time",
                        "in": "query"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            },
            "post": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "用户预订会议室",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "预订"
                ],
                "summary": "预订会议室",
                "parameters": [
                    {
                        "description": "预订参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.BookRoomRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/bookings/{id}": {
            "delete": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "取消指定ID的预订",
                "tags": [
                    "预订"
                ],
                "summary": "取消预订",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "预订ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/login": {
            "post": {
                "description": "用户登录，返回JWT",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "用户"
                ],
                "summary": "用户登录",
                "parameters": [
                    {
                        "description": "登录参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.LoginRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/mybookings": {
            "get": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "查询当前用户的预订记录",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "预订"
                ],
                "summary": "查询个人预订",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/register": {
            "post": {
                "description": "用户注册，返回JWT",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "用户"
                ],
                "summary": "用户注册",
                "parameters": [
                    {
                        "description": "注册参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.RegisterRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/rooms": {
            "get": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "查询所有会议室",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "会议室"
                ],
                "summary": "查询会议室列表",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            },
            "post": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "管理员添加会议室",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "会议室"
                ],
                "summary": "添加会议室",
                "parameters": [
                    {
                        "description": "会议室参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.AddRoomRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/rooms/{id}": {
            "put": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "管理员编辑会议室",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "会议室"
                ],
                "summary": "编辑会议室",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "会议室ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "编辑参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.EditRoomRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            },
            "delete": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "管理员删除会议室",
                "tags": [
                    "会议室"
                ],
                "summary": "删除会议室",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "会议室ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        },
        "/api/user/profile": {
            "put": {
                "security": [
                    {
                        "Bearer": []
                    }
                ],
                "description": "更新当前用户的昵称",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "用户"
                ],
                "summary": "更新用户信息",
                "parameters": [
                    {
                        "description": "更新参数",
                        "name": "data",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/main.UpdateProfileRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "object",
                            "additionalProperties": true
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "main.AddRoomRequest": {
            "type": "object",
            "required": [
                "capacity",
                "name"
            ],
            "properties": {
                "capacity": {
                    "type": "integer"
                },
                "name": {
                    "type": "string"
                }
            }
        },
        "main.BookRoomRequest": {
            "type": "object",
            "required": [
                "end_time",
                "room_id",
                "start_time"
            ],
            "properties": {
                "end_time": {
                    "type": "string"
                },
                "room_id": {
                    "type": "integer"
                },
                "start_time": {
                    "type": "string"
                }
            }
        },
        "main.EditRoomRequest": {
            "type": "object",
            "properties": {
                "capacity": {
                    "type": "integer"
                },
                "name": {
                    "type": "string"
                }
            }
        },
        "main.LoginRequest": {
            "type": "object",
            "required": [
                "password",
                "username"
            ],
            "properties": {
                "password": {
                    "type": "string"
                },
                "username": {
                    "type": "string"
                }
            }
        },
        "main.RegisterRequest": {
            "type": "object",
            "required": [
                "password",
                "username"
            ],
            "properties": {
                "password": {
                    "type": "string"
                },
                "username": {
                    "type": "string"
                }
            }
        },
        "main.SSORequest": {
            "type": "object",
            "required": [
                "email"
            ],
            "properties": {
                "email": {
                    "type": "string"
                },
                "nickname": {
                    "type": "string"
                },
                "role": {
                    "description": "'admin' or empty",
                    "type": "string"
                }
            }
        },
        "main.UpdateProfileRequest": {
            "type": "object",
            "required": [
                "nickname"
            ],
            "properties": {
                "nickname": {
                    "type": "string"
                }
            }
        }
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header"
        }
    }
}`

// SwaggerInfo holds exported Swagger Info so clients can modify it
var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "",
	BasePath:         "",
	Schemes:          []string{},
	Title:            "会议室预订系统 API",
	Description:      "用于会议室管理和预订的后端API",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
