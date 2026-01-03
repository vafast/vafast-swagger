# @vafast/swagger

Plugin for [Vafast](https://github.com/vafastjs/vafast) to auto-generate Swagger/OpenAPI documentation.

## Installation

```bash
bun add @vafast/swagger
# or
npm install @vafast/swagger
```

## Example

```typescript
import { Server, createHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

// Create Swagger middleware
const swaggerMiddleware = swagger({
  provider: 'scalar',
  documentation: {
    info: {
      title: 'Vafast API',
      version: '1.0.0'
    }
  }
})

// Define routes
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => {
      return { message: 'Hello World' }
    })
  },
  {
    method: 'POST',
    path: '/json/:id',
    handler: createHandler(async (req: Request) => {
      const body = await req.json()
      const url = new URL(req.url)
      const id = url.pathname.split('/').pop()
      return { ...body, id }
    })
  }
]

// Create server
const server = new Server(routes)

// Apply Swagger middleware
export default {
  fetch: (req: Request) => {
    return swaggerMiddleware(req, () => server.fetch(req))
  }
}
```

Then go to `http://localhost:3000/swagger`.

## Configuration

### provider

@default `'scalar'`

Choose between [Scalar](https://github.com/scalar/scalar) & [SwaggerUI](https://github.com/swagger-api/swagger-ui)

### documentation

Customize OpenAPI documentation, refers to [OpenAPI 3.0.3 spec](https://swagger.io/specification/v3)

### scalarConfig

Customize scalar configuration, refers to [Scalar config](https://github.com/scalar/scalar/blob/main/documentation/configuration.md)

### path

@default `'/swagger'`

The endpoint to expose Swagger documentation

### specPath

@default `'/${path}/json'`

The endpoint to expose OpenAPI JSON specification

### excludeStaticFile

@default `true`

Determine if Swagger should exclude static files.

### exclude

@default `[]`

Paths to exclude from the Swagger endpoint

## License

MIT
