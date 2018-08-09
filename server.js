const express = require('express')
const app = express()
const fs = require('fs')

const config = require('./config')

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', (req, res) => {
  const fileExtensions = config.tiposArchivo
  let movieList = ''
  let files = fs.readdirSync(config.carpetaPelis)
  files.forEach((file, i) => {
    const extension = file.split('.')[file.split('.').length - 1]
    if (fileExtensions.indexOf(extension) > -1) movieList += `<li><a href="/watch/${i}">${file}</a></li>`
  })
  res.send(movieList)
})

app.get('/watch/:id', (req, res) => {
  res.send(
    `<video id="videoPlayer" controls autoplay>
      <source src="/serve/${req.params.id}" type="video/mp4">
    </video>`)
})

app.get('/serve/:id', function (req, res) {
  const fileName = fs.readdirSync(config.carpetaPelis)[req.params.id]
  const path = `${config.carpetaPelis}${fileName}`
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ?
      parseInt(parts[1], 10) :
      fileSize - 1
    const chunksize = (end - start) + 1
    const file = fs.createReadStream(path, {
      start,
      end
    })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/webm',
    }
    res.writeHead(206, head)
    file.pipe(res)
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/webm',
    }
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
})

app.listen(3000, '0.0.0.0', () => console.log('Servidor listo en el puerto 3000'))
