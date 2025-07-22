import '@testing-library/jest-dom'

global.fetch = jest.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Web API polyfills for Next.js testing
global.Request = class Request {
  constructor(url, init) {
    this.url = url
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers || {})
    this.body = init?.body || null
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
  
  async text() {
    return this.body || ''
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Headers(init?.headers || {})
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
  
  async text() {
    return this.body || ''
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
  }
}

global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase())
  }
}

// Mock NextResponse
global.NextResponse = class NextResponse extends Response {
  static json(data, init) {
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
  }
  
  static redirect(url, init) {
    return new NextResponse(null, {
      ...init,
      status: 302,
      headers: {
        Location: url,
        ...init?.headers
      }
    })
  }
}

// Mock NextRequest
global.NextRequest = class NextRequest extends Request {
  constructor(url, init) {
    super(url, init)
    this.nextUrl = new URL(url)
  }
}