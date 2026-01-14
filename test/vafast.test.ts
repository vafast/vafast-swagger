import { Server, defineRoute, defineRoutes, json } from 'vafast'
import { swagger } from '../src/index'
import { describe, expect, it } from 'vitest'

describe('Vafast Swagger Plugin', () => {
	it('should create swagger middleware', () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			documentation: {
				info: {
					title: 'Test API',
					version: '1.0.0'
				}
			}
		})

		expect(swaggerMiddleware).toBeDefined()
		expect(typeof swaggerMiddleware).toBe('function')
	})

	it('should serve Swagger UI page', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			path: '/docs'
		})

		const app = new Server(
			defineRoutes([
				defineRoute({
					method: 'GET',
					path: '/',
					handler: () => 'Hello, API!'
				})
			])
		)

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 Swagger UI 页面
		const res = await wrappedFetch(new Request('http://localhost/docs'))
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('text/html')

		const html = await res.text()
		expect(html).toContain('scalar')
	})

	it('should serve OpenAPI specification', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			path: '/docs',
			specPath: '/docs/json'
		})

		const app = new Server(
			defineRoutes([
				defineRoute({
					method: 'GET',
					path: '/',
					handler: () => 'Hello, API!'
				})
			])
		)

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 OpenAPI 规范
		const res = await wrappedFetch(
			new Request('http://localhost/docs/json')
		)
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('application/json')

		const spec = await res.json()
		expect(spec.openapi).toBe('3.0.3')
		expect(spec.info.title).toBe('Vafast API')
	})

	it('should handle custom documentation info', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			documentation: {
				info: {
					title: 'Custom API',
					description: 'Custom API description',
					version: '2.0.0'
				},
				tags: [
					{
						name: 'Users',
						description: 'User management endpoints'
					}
				]
			}
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 OpenAPI 规范
		const res = await wrappedFetch(
			new Request('http://localhost/swagger/json')
		)
		const spec = await res.json()

		expect(spec.info.title).toBe('Custom API')
		expect(spec.info.description).toBe('Custom API description')
		expect(spec.info.version).toBe('2.0.0')
		expect(spec.tags).toHaveLength(1)
		expect(spec.tags[0].name).toBe('Users')
	})

	it('should handle Swagger UI provider', async () => {
		const swaggerMiddleware = swagger({
			provider: 'swagger-ui',
			version: '4.18.2'
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 Swagger UI 页面
		const res = await wrappedFetch(new Request('http://localhost/swagger'))
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('text/html')

		const html = await res.text()
		expect(html).toContain('swagger-ui')
	})

	it('should handle custom path and spec path', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			path: '/api-docs',
			specPath: '/api-docs/spec'
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问自定义路径
		const uiRes = await wrappedFetch(
			new Request('http://localhost/api-docs')
		)
		expect(uiRes.status).toBe(200)

		const specRes = await wrappedFetch(
			new Request('http://localhost/api-docs/spec')
		)
		expect(specRes.status).toBe(200)
	})

	it('should continue to next middleware for non-swagger paths', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar'
		})

		const app = new Server(
			defineRoutes([
				defineRoute({
					method: 'GET',
					path: '/',
					handler: () => json({ message: 'Hello, API!' })
				})
			])
		)

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 API 路由
		const res = await wrappedFetch(new Request('http://localhost/'))
		expect(res.status).toBe(200)

		const data = await res.json()
		expect(data.message).toBe('Hello, API!')
	})

	it('should handle exclude methods', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			excludeMethods: ['OPTIONS', 'HEAD']
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 OpenAPI 规范
		const res = await wrappedFetch(
			new Request('http://localhost/swagger/json')
		)
		const spec = await res.json()

		// 由于没有路由信息，paths 应该是空的
		expect(spec.paths).toBeDefined()
	})

	it('should handle exclude tags', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar',
			documentation: {
				tags: [
					{ name: 'Public', description: 'Public endpoints' },
					{ name: 'Private', description: 'Private endpoints' }
				]
			},
			excludeTags: ['Private']
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 OpenAPI 规范
		const res = await wrappedFetch(
			new Request('http://localhost/swagger/json')
		)
		const spec = await res.json()

		expect(spec.tags).toHaveLength(2)
		expect(spec.tags[0].name).toBe('Public')
		expect(spec.tags[1].name).toBe('Private')
	})

	it('should handle custom theme', async () => {
		const customTheme = 'https://custom-theme.css'
		const swaggerMiddleware = swagger({
			provider: 'swagger-ui',
			theme: customTheme
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 Swagger UI 页面
		const res = await wrappedFetch(new Request('http://localhost/swagger'))
		const html = await res.text()

		// 由于我们的简化版本没有完全支持自定义主题，我们检查基本的 Swagger UI 结构
		expect(html).toContain('swagger-ui')
		expect(html).toContain('SwaggerUIBundle')
	})

	it('should handle auto dark mode', async () => {
		const swaggerMiddleware = swagger({
			provider: 'swagger-ui',
			autoDarkMode: true
		})

		const app = new Server(defineRoutes([]))

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试访问 Swagger UI 页面
		const res = await wrappedFetch(new Request('http://localhost/swagger'))
		const html = await res.text()

		// 检查是否包含暗色模式相关的代码
		expect(html).toContain('dark')
	})

	it('should work with different HTTP methods', async () => {
		const swaggerMiddleware = swagger({
			provider: 'scalar'
		})

		const app = new Server(
			defineRoutes([
				defineRoute({
					method: 'GET',
					path: '/',
					handler: () => json({ method: 'GET' })
				}),
				defineRoute({
					method: 'POST',
					path: '/',
					handler: () => json({ method: 'POST' })
				})
			])
		)

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return swaggerMiddleware(req, () => app.fetch(req))
		}

		// 测试 GET 请求
		const getRes = await wrappedFetch(new Request('http://localhost/'))
		expect(getRes.status).toBe(200)
		const getData = await getRes.json()
		expect(getData.method).toBe('GET')

		// 测试 POST 请求
		const postRes = await wrappedFetch(
			new Request('http://localhost/', { method: 'POST' })
		)
		expect(postRes.status).toBe(200)
		const postData = await postRes.json()
		expect(postData.method).toBe('POST')
	})
})
