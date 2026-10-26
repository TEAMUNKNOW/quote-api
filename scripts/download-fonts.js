'use strict'

// Download the licensed Noto Sans variable font during the build so Vercel
// serverless functions have a real Unicode font instead of host-dependent
// fallback glyphs. The font is cached in the deployment bundle.
const fs = require('fs')
const path = require('path')
const https = require('https')

const targetDir = path.resolve(__dirname, '../assets/fonts')
const target = path.join(targetDir, 'NotoSans[wdth,wght].ttf')
const url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'

function download (url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many font download redirects'))
    https.get(url, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume()
        return resolve(download(response.headers.location, redirects + 1))
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error('Font download failed with HTTP ' + response.statusCode))
      }
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

async function main () {
  fs.mkdirSync(targetDir, { recursive: true })
  if (fs.existsSync(target) && fs.statSync(target).size > 100000) {
    console.log('Noto Sans font already present')
    return
  }
  const font = await download(url)
  if (font.length < 100000 || font.toString('ascii', 0, 4) !== '\\u0000\\u0001\\u0000\\u0000') {
    // Some TTF parsers identify the TrueType signature as 00 01 00 00.
    if (font.length < 100000 || !(font[0] === 0 && font[1] === 1 && font[2] === 0 && font[3] === 0)) {
      throw new Error('Downloaded Noto Sans font is invalid')
    }
  }
  fs.writeFileSync(target, font)
  console.log('Downloaded Noto Sans font (' + font.length + ' bytes)')
}

main().catch(error => {
  console.error('Unable to prepare Noto Sans font:', error.message)
  process.exitCode = 1
})
