import { NextResponse } from 'next/server'

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
}

export function middleware(req) {
  const basicAuth = req.headers.get('authorization')
  const USER = process.env.AUTH_USER
  const PASS = process.env.AUTH_PASS

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [u, p] = Buffer.from(authValue, 'base64').toString().split(':')

    if (u === USER && p === PASS) {
      return NextResponse.next()
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="FacturaScan 360 Docs"',
    },
  })
}
