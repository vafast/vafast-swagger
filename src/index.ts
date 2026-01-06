import type { Middleware } from 'vafast'
import { html as htmlResponse, json } from 'vafast'

// 简化的 OpenAPI 类型定义
interface OpenAPIInfo {
	title?: string
	description?: string
	version?: string
}

interface OpenAPITag {
	name: string
	description?: string
}

interface OpenAPISchema {
	type: string
	properties?: Record<string, any>
	required?: string[]
}

interface OpenAPISecurityScheme {
	type: string
	scheme?: string
	bearerFormat?: string
	description?: string
}

interface OpenAPIComponents {
	schemas?: Record<string, OpenAPISchema>
	securitySchemes?: Record<string, OpenAPISecurityScheme>
}

interface OpenAPIDocumentation {
	info?: OpenAPIInfo
	tags?: OpenAPITag[]
	components?: OpenAPIComponents
	paths?: Record<string, any>
}

interface VafastSwaggerConfig<Path extends string = '/swagger'> {
	provider?: 'scalar' | 'swagger-ui'
	scalarVersion?: string
	scalarCDN?: string
	scalarConfig?: Record<string, any>
	documentation?: OpenAPIDocumentation
	version?: string
	excludeStaticFile?: boolean
	path?: Path
	specPath?: string
	exclude?: string | RegExp | (string | RegExp)[]
	swaggerOptions?: Record<string, any>
	theme?: string | { light: string; dark: string }
	autoDarkMode?: boolean
	excludeMethods?: string[]
	excludeTags?: string[]
}

/**
 * 简化的 Swagger UI 渲染函数
 */
const renderSwaggerUI = (
	info: OpenAPIInfo,
	version: string,
	theme: string,
	swaggerOptions: Record<string, any>,
	autoDarkMode: boolean
) => {
	const title = info.title || 'API Documentation'
	const description = info.description || 'API documentation'
	const apiVersion = info.version || '1.0.0'

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@${version}/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        ${
			autoDarkMode
				? `
        @media (prefers-color-scheme: dark) {
            body { background: #1a1a1a; }
        }
        `
				: ''
		}
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${version}/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@${version}/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalone.presets.standalone],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                layout: "StandaloneLayout",
                ${Object.entries(swaggerOptions)
					.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
					.join(',\n                ')}
            });
        };
    </script>
</body>
</html>`
}

/**
 * 简化的 Scalar 渲染函数
 */
const renderScalar = (
	info: OpenAPIInfo,
	version: string,
	config: Record<string, any>,
	cdn: string
) => {
	const title = info.title || 'API Documentation'
	const description = info.description || 'API documentation'

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #api-reference { min-height: 100vh; }
    </style>
</head>
<body>
    <div id="api-reference" data-url="./json" data-configuration='${JSON.stringify(
		config
	)}'></div>
    <script src="${
		cdn ||
		`https://cdn.jsdelivr.net/npm/@scalar/api-reference@${version}/dist/browser/standalone.min.js`
	}" crossorigin></script>
</body>
</html>`
}

/**
 * 创建 OpenAPI 规范
 */
const createOpenAPISpec = (documentation: OpenAPIDocumentation) => {
	return {
		openapi: '3.0.3',
		info: {
			title: documentation.info?.title || 'Vafast API',
			description: documentation.info?.description || 'API documentation',
			version: documentation.info?.version || '1.0.0'
		},
		paths: documentation.paths || {},
		components: documentation.components || {},
		tags: documentation.tags || []
	}
}

/**
 * Vafast Swagger 中间件
 */
export const swagger = <Path extends string = '/swagger'>({
	provider = 'scalar',
	scalarVersion = 'latest',
	scalarCDN = '',
	scalarConfig = {},
	documentation = {},
	version = '4.18.2',
	excludeStaticFile = true,
	path = '/swagger' as Path,
	specPath = `${path}/json`,
	exclude = [],
	swaggerOptions = {},
	theme = `https://unpkg.com/swagger-ui-dist@${version}/swagger-ui.css`,
	autoDarkMode = true,
	excludeMethods = ['OPTIONS'],
	excludeTags = []
}: VafastSwaggerConfig<Path> = {}) => {
	// 返回 vafast 中间件
	return (req: Request, next: () => Promise<Response>): Promise<Response> => {
		const url = new URL(req.url)

		// 处理 Swagger UI 页面
		if (url.pathname === path) {
			const htmlContent =
				provider === 'swagger-ui'
					? renderSwaggerUI(
							documentation.info || {},
							version,
							theme as string,
							swaggerOptions,
							autoDarkMode
					  )
					: renderScalar(
							documentation.info || {},
							scalarVersion,
							scalarConfig,
							scalarCDN
					  )

			return Promise.resolve(htmlResponse(htmlContent))
		}

		// 处理 OpenAPI 规范
		if (url.pathname === specPath) {
			const spec = createOpenAPISpec(documentation)

			return Promise.resolve(json(spec))
		}

		// 继续处理其他请求
		return next()
	}
}

export type { VafastSwaggerConfig }
export default swagger
