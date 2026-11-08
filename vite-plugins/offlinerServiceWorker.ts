import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

export const SW_VERSION_PLACEHOLDER = '"__OFFLINER_BUILD_VERSION__"'
export const SW_PRECACHE_PLACEHOLDER = '/*__OFFLINER_PRECACHE__*/ []'

// Production-only Content-Security-Policy. The app has no backend and loads
// nothing from other origins, so everything is restricted to the app itself.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/**
 * Production build only:
 *  - injects the Content-Security-Policy;
 *  - writes the build version and the list of generated files into dist/sw.js,
 *    so each deployment gets a fresh cache and works offline on first visit.
 */
export function offlinerServiceWorker(): Plugin {
  let outDir = 'dist'
  let precache: string[] = []
  let version = ''

  return {
    name: 'offliner-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: CONTENT_SECURITY_POLICY,
          },
          injectTo: 'head-prepend',
        },
      ]
    },
    generateBundle(_options, bundle) {
      const hash = createHash('sha256')
      const files = Object.keys(bundle).sort()
      for (const fileName of files) {
        const output = bundle[fileName]
        hash.update(fileName)
        hash.update(output.type === 'chunk' ? output.code : output.source)
      }
      version = hash.digest('hex').slice(0, 16)
      precache = files
        .filter((fileName) => fileName !== 'index.html' && !fileName.endsWith('.map'))
        .map((fileName) => `./${fileName}`)
    },
    // Runs once the public directory has been copied into the output.
    async closeBundle() {
      const swPath = resolve(outDir, 'sw.js')
      const source = await readFile(swPath, 'utf8')
      if (
        !source.includes(SW_VERSION_PLACEHOLDER) ||
        !source.includes(SW_PRECACHE_PLACEHOLDER)
      ) {
        throw new Error('dist/sw.js does not contain the expected placeholders.')
      }
      await writeFile(
        swPath,
        source
          .replace(SW_VERSION_PLACEHOLDER, JSON.stringify(version))
          .replace(SW_PRECACHE_PLACEHOLDER, JSON.stringify(precache)),
      )
    },
  }
}
