# @vafast/swagger

为 Vafast 提供 OpenAPI UI（[Scalar](https://github.com/scalar/scalar) / [Swagger UI](https://swagger.io/tools/swagger-ui/)）与 OpenAPI JSON 端点。

> **不会自动扫描路由。** 规范完全来自手写的 `documentation`（尤其是 `documentation.paths`）。类型中的 `theme` / `exclude*` 等在中间件主路径上**未使用**。

## 先搞清几个概念

OpenAPI 3.0.3 文档由中间件拼出，字段来自 `documentation`：

| 字段 | 作用 |
|------|------|
| `info.title` / `description` / `version` | API 名称、说明、**API 版本**（缺省分别为 `Vafast API` / `API documentation` / `1.0.0`） |
| `paths` | 接口列表；不写则 UI 空白 |
| `components` | 可复用 `schemas`、`securitySchemes` 等 |
| `tags` | 分组标签元数据 |

`provider: 'scalar' | 'swagger-ui'` 只影响 HTML UI，不影响 JSON 规范本身。

配置项 `version` 是 **Swagger UI CDN** 版本；`scalarVersion` 是 Scalar CDN 版本——不要和 `info.version` 混淆。

## 安装

```bash
npm install @vafast/swagger
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => [{ id: 1 }],
  }),
])

const server = new Server(routes)

server.use(
  swagger({
    path: '/swagger',
    provider: 'scalar',
    documentation: {
      info: {
        title: 'My API',
        version: '1.0.0',
        description: '示例 API',
      },
      paths: {
        '/users': {
          get: {
            summary: '用户列表',
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    },
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

- UI：`/swagger`
- JSON：`/swagger/json`（默认 `specPath = ${path}/json`）

## 用法

### components 最小示例

```typescript
documentation: {
  info: { title: 'API', version: '1.0.0' },
  tags: [{ name: 'users', description: '用户' }],
  paths: {
    '/users/{id}': {
      get: {
        tags: ['users'],
        summary: '详情',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
}
```

### 切换 UI / 自定义路径

```typescript
swagger({
  provider: 'swagger-ui',
  version: '4.18.2',
  path: '/docs',
  specPath: '/docs/openapi.json',
  documentation: { /* ... */ },
})
```

## API

### `swagger(config?)`

| 参数 | 默认 | 说明 |
|------|------|------|
| `provider` | `'scalar'` | `'scalar'` \| `'swagger-ui'` |
| `path` | `'/swagger'` | UI 路径 |
| `specPath` | `` `${path}/json` `` | OpenAPI JSON 路径 |
| `documentation` | `{}` | 手写：`info` / `paths` / `components` / `tags` |
| `scalarVersion` | `'latest'` | Scalar CDN 版本 |
| `scalarCDN` | `''` | 自定义 Scalar script；空则 jsDelivr |
| `scalarConfig` | `{}` | Scalar `data-configuration` |
| `version` | `'4.18.2'` | swagger-ui-dist 版本 |
| `swaggerOptions` | `{}` | 注入 SwaggerUIBundle |
| `autoDarkMode` | `true` | Swagger UI 暗色媒体查询 |

生成规范：`openapi: '3.0.3'` + 上述 `documentation` 字段。

### 配置了但当前未使用

`theme`、`excludeStaticFile`、`exclude`、`excludeMethods`、`excludeTags`：**未用于**换肤、自动过滤或扫描路由。

## 最佳实践

- 将 `documentation` 抽到独立模块，与路由变更一起维护
- 用 `components.schemas` + `$ref` 减少重复
- 生产可限制 UI 访问范围；内网注意 CDN / 自建静态资源

## 注意事项

- **不会**从 `defineRoute` 生成 paths；漏写 = UI 空白
- `theme` / `exclude*` 不要当成有效开关
- UI 默认相对路径拉 `./json`；自定义 `path` 时注意与 `specPath` 的关系
- Scalar 可用 `scalarCDN` 指向内网；Swagger UI 资源 URL 当前写死 unpkg

## 相关链接

- 文档：[`docs/middleware/swagger.md`](../vafast-doc/docs/middleware/swagger.md)
- [OpenAPI 3.0.3](https://swagger.io/specification/v3)
- [Scalar](https://github.com/scalar/scalar)
- [Swagger UI](https://github.com/swagger-api/swagger-ui)

## License

MIT
