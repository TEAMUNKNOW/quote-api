'use strict'

// Bundle script-specific Unicode fonts at build time. Noto Sans is SIL OFL
// licensed; fonts are loaded locally by node-canvas at runtime.
const fs = require('fs')
const path = require('path')
const https = require('https')

const dir = path.resolve(__dirname, '../assets/fonts')
const fonts = [
  ['NotoSans[wdth,wght].ttf', 'ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansDevanagari[wdth,wght].ttf', 'ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansBengali[wdth,wght].ttf', 'ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansTamil[wdth,wght].ttf', 'ofl/notosanstamil/NotoSansTamil%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansTelugu[wdth,wght].ttf', 'ofl/notosanstelugu/NotoSansTelugu%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansGujarati[wdth,wght].ttf', 'ofl/notosansgujarati/NotoSansGujarati%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansGurmukhi[wdth,wght].ttf', 'ofl/notosansgurmukhi/NotoSansGurmukhi%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansArabic[wdth,wght].ttf', 'ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansThai[wdth,wght].ttf', 'ofl/notosansthai/NotoSansThai%5Bwdth%2Cwght%5D.ttf'],
  ['NotoSansMath-Regular.ttf', 'ofl/notosansmath/NotoSansMath-Regular.ttf'],
  ['NotoSansSymbols2-Regular.ttf', 'ofl/notosanssymbols2/NotoSansSymbols2-Regular.ttf']
]

function get (url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'))
    https.get(url, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume()
        return resolve(get(response.headers.location, redirects + 1))
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error('HTTP ' + response.statusCode + ' for ' + url))
      }
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

async function main () {
  fs.mkdirSync(dir, { recursive: true })
  for (const [file, relative] of fonts) {
    const target = path.join(dir, file)
    if (fs.existsSync(target) && fs.statSync(target).size > 50000) continue
    const data = await get('https://raw.githubusercontent.com/google/fonts/main/' + relative)
    const signature = data.subarray(0, 4).toString('hex')
    if (data.length < 50000 || (signature !== '00010000' && signature !== '4f54544f')) {
      throw new Error('Invalid font file: ' + file)
    }
    fs.writeFileSync(target, data)
    console.log('Bundled ' + file + ' (' + data.length + ' bytes)')
  }
}

main().catch(error => {
  console.error('Font setup failed:', error)
  process.exitCode = 1
})
