const { app } = require('../app')
const { loadFonts } = require('../utils')

let fontsPromise

module.exports = async (req, res) => {
  if (!fontsPromise) {
    fontsPromise = loadFonts()
  }

  try {
    await fontsPromise
  } catch (error) {
    fontsPromise = null
    console.error('Failed to load fonts:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'font_load_failed' }))
    return
  }

  return app.callback()(req, res)
}
