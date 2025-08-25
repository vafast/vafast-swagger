import { Server, createRouteHandler } from 'vafast'
import { swagger } from '../src/index'

// 创建 Swagger 中间件
const swaggerMiddleware = swagger({
	provider: 'scalar',
	documentation: {
		info: {
			title: 'Vafast Scalar',
			version: '0.8.1'
		},
		tags: [
			{
				name: 'Test',
				description: 'Hello'
			}
		],
		components: {
			schemas: {
				User: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						email: { type: 'string' }
					}
				}
			},
			securitySchemes: {
				JwtAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Enter JWT Bearer token **_only_**'
				}
			}
		}
	},
	swaggerOptions: {
		persistAuthorization: true
	}
})

// 定义路由
const routes = [
	{
		method: 'GET',
		path: '/api/',
		handler: createRouteHandler(() => {
			return { test: 'hello' }
		})
	},
	{
		method: 'POST',
		path: '/api/json',
		handler: createRouteHandler(async (req: Request) => {
			const body = await req.json()
			return body
		})
	}
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用 Swagger 中间件
export default {
	fetch: (req: Request) => {
		// 应用 Swagger 中间件
		return swaggerMiddleware(req, () => server.fetch(req))
	}
}

console.log('Server running with Swagger documentation')
console.log('Swagger UI available at: /swagger')
console.log('OpenAPI spec available at: /swagger/json')
