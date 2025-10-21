import swaggerJsdoc from 'swagger-jsdoc'
import { env } from '../lib/env'

/**
 * Swagger/OpenAPI 配置
 *
 * 该配置文件定义了 API 文档的结构和元数据
 * 使用 OpenAPI 3.0 规范
 */

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sora2 视频生成平台 API',
      version: '1.0.0',
      description: `
# Sora2 API 文档

欢迎使用 Sora2 视频生成平台 API。本文档提供了完整的 API 接口说明。

## 功能特性

- 用户认证与授权
- 视频生成与管理
- 积分系统
- 订单支付系统
- 管理后台接口
- 公开 API 接口

## 认证方式

本 API 支持三种认证方式:

### 1. JWT Bearer Token (用户认证)
大多数接口使用 JWT Token 进行认证。在请求头中添加:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

### 2. Cookie Authentication (刷新 Token)
刷新 Token 存储在 HttpOnly Cookie 中,用于获取新的访问令牌。

### 3. API Key (公开接口)
公开接口使用 API Key 认证,可通过以下两种方式提供:
- Header: \`x-api-key: <your_api_key>\`
- Authorization: \`Bearer <your_api_key>\`

## 速率限制

为保护服务器资源,API 实施了以下速率限制:

- 一般接口: 100 次/15分钟
- 认证接口: 100 次/15分钟
- 注册接口: 3 次/小时
- 视频生成: 10 次/小时

## 错误处理

API 使用标准 HTTP 状态码。错误响应格式:
\`\`\`json
{
  "error": "Error Type",
  "message": "详细错误描述",
  "statusCode": 400
}
\`\`\`

## 常见状态码

- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未授权(需要登录)
- 403: 禁止访问(权限不足)
- 404: 资源未找到
- 429: 请求过于频繁
- 500: 服务器错误

## 支持

如有问题,请联系技术支持:
- Email: support@sora2.com
- GitHub: https://github.com/sora2/api
      `,
      contact: {
        name: 'Sora2 API Support',
        email: 'support@sora2.com',
        url: 'https://sora2.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://sora2.com/terms'
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: '本地开发服务器'
      },
      {
        url: env.NODE_ENV === 'production' ? 'https://api.sora2.com' : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === 'production' ? '生产环境' : '开发环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用 JWT Token 进行认证。在 Authorization header 中添加: Bearer <token>'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh Token 存储在 HttpOnly Cookie 中,用于刷新访问令牌'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API Key 认证,用于公开接口。可在 x-api-key header 或 Authorization: Bearer <key> 中提供'
        }
      },
      schemas: {
        // 基础错误响应
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '错误类型',
              example: 'Validation Error'
            },
            message: {
              type: 'string',
              description: '详细错误描述',
              example: '请求参数验证失败'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP 状态码',
              example: 400
            },
            errors: {
              type: 'array',
              description: '详细的验证错误列表(仅验证错误时存在)',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: '字段名'
                  },
                  message: {
                    type: 'string',
                    description: '错误信息'
                  }
                }
              }
            }
          }
        },
        // 用户模型
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '用户唯一标识符',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱地址',
              example: 'user@example.com'
            },
            username: {
              type: 'string',
              description: '用户名',
              example: 'johndoe'
            },
            avatarUrl: {
              type: 'string',
              nullable: true,
              description: '用户头像 URL',
              example: 'https://cdn.sora2.com/avatars/user123.jpg'
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: '用户角色',
              example: 'USER'
            },
            bio: {
              type: 'string',
              nullable: true,
              description: '个人简介',
              example: '热爱视频创作的设计师'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '账户创建时间',
              example: '2024-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '最后更新时间',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        // 视频模型
        Video: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '视频唯一标识符',
              example: '123e4567-e89b-12d3-a456-426614174001'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: '创建该视频的用户 ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            prompt: {
              type: 'string',
              description: '视频生成的提示词',
              example: '一只可爱的小猫在草地上玩耍'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
              description: '视频生成状态',
              example: 'COMPLETED'
            },
            videoUrl: {
              type: 'string',
              nullable: true,
              description: '生成的视频 URL',
              example: 'https://cdn.sora2.com/videos/video123.mp4'
            },
            thumbnailUrl: {
              type: 'string',
              nullable: true,
              description: '视频缩略图 URL',
              example: 'https://cdn.sora2.com/thumbnails/video123.jpg'
            },
            duration: {
              type: 'integer',
              nullable: true,
              description: '视频时长(秒)',
              example: 5
            },
            aspectRatio: {
              type: 'string',
              description: '视频宽高比',
              example: '16:9'
            },
            model: {
              type: 'string',
              description: '使用的生成模型',
              example: 'sora-v1'
            },
            progress: {
              type: 'integer',
              description: '生成进度(0-100)',
              example: 100
            },
            errorMessage: {
              type: 'string',
              nullable: true,
              description: '错误信息(状态为 FAILED 时)',
              example: null
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
              example: '2024-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        // 积分交易模型
        Credit: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '交易记录唯一标识符',
              example: '123e4567-e89b-12d3-a456-426614174002'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: '用户 ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            amount: {
              type: 'integer',
              description: '积分变动数量(正数为增加,负数为减少)',
              example: 100
            },
            balance: {
              type: 'integer',
              description: '交易后的积分余额',
              example: 1000
            },
            type: {
              type: 'string',
              enum: ['RECHARGE', 'CONSUME', 'REFUND', 'REWARD'],
              description: '交易类型',
              example: 'RECHARGE'
            },
            description: {
              type: 'string',
              description: '交易描述',
              example: '充值 100 积分'
            },
            orderId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: '关联的订单 ID(如果有)',
              example: null
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '交易时间',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        // 订单模型
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '订单唯一标识符',
              example: '123e4567-e89b-12d3-a456-426614174003'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: '用户 ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: '订单金额(元)',
              example: 99.99
            },
            credits: {
              type: 'integer',
              description: '购买的积分数量',
              example: 100
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
              description: '订单状态',
              example: 'PAID'
            },
            paymentMethod: {
              type: 'string',
              enum: ['ALIPAY', 'WECHAT', 'STRIPE'],
              description: '支付方式',
              example: 'ALIPAY'
            },
            paymentId: {
              type: 'string',
              nullable: true,
              description: '支付平台的交易 ID',
              example: 'pay_123456789'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '订单创建时间',
              example: '2024-01-01T00:00:00.000Z'
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: '支付完成时间',
              example: '2024-01-01T00:05:00.000Z'
            }
          }
        }
      },
      responses: {
        // 通用错误响应
        UnauthorizedError: {
          description: '未授权 - 需要登录或 Token 无效',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized',
                message: '请先登录',
                statusCode: 401
              }
            }
          }
        },
        ForbiddenError: {
          description: '禁止访问 - 权限不足',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Forbidden',
                message: '您没有权限访问此资源',
                statusCode: 403
              }
            }
          }
        },
        NotFoundError: {
          description: '资源未找到',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Not Found',
                message: '请求的资源不存在',
                statusCode: 404
              }
            }
          }
        },
        ValidationError: {
          description: '请求参数验证失败',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation Error',
                message: '请求参数验证失败',
                statusCode: 400,
                errors: [
                  {
                    field: 'email',
                    message: '邮箱格式不正确'
                  }
                ]
              }
            }
          }
        },
        RateLimitError: {
          description: '请求频率超限',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Too Many Requests',
                message: '请求过于频繁,请稍后再试',
                statusCode: 429
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: '用户认证相关接口 - 注册、登录、登出、密码重置等',
        externalDocs: {
          description: '了解更多关于认证',
          url: 'https://sora2.com/docs/auth'
        }
      },
      {
        name: 'User',
        description: '用户信息管理接口 - 个人资料、头像、密码修改等',
        externalDocs: {
          description: '用户管理文档',
          url: 'https://sora2.com/docs/user'
        }
      },
      {
        name: 'Video',
        description: '视频生成和管理接口 - 创建、查询、下载、分享视频',
        externalDocs: {
          description: '视频生成指南',
          url: 'https://sora2.com/docs/video'
        }
      },
      {
        name: 'Credit',
        description: '积分管理接口 - 查询余额、交易记录、充值等',
        externalDocs: {
          description: '积分系统说明',
          url: 'https://sora2.com/docs/credits'
        }
      },
      {
        name: 'Order',
        description: '订单管理接口 - 创建订单、支付、查询订单等',
        externalDocs: {
          description: '支付流程说明',
          url: 'https://sora2.com/docs/orders'
        }
      },
      {
        name: 'Admin',
        description: '管理员接口 - 系统管理、用户管理、数据统计等(需要管理员权限)',
        externalDocs: {
          description: '管理员文档',
          url: 'https://sora2.com/docs/admin'
        }
      },
      {
        name: 'Public',
        description: '公开接口 - 无需用户认证,使用 API Key 访问的接口',
        externalDocs: {
          description: 'API Key 使用指南',
          url: 'https://sora2.com/docs/api-keys'
        }
      }
    ],
    externalDocs: {
      description: '完整的 API 使用文档',
      url: 'https://sora2.com/docs'
    }
  },
  // 扫描所有路由文件以提取 Swagger 注释
  apis: ['./src/routes/*.ts']
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)

// 导出配置供测试和其他用途使用
export { swaggerOptions }
