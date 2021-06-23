const cheerio = require('cheerio')
const FormData = require('form-data')
const fetch = require('node-fetch')
const fs = require('fs')

const getIdsByPopularity = async (i) => {
  try {
    const txtUrl = `http://usdb.animux.de/index.php?link=list`
    let formData = new FormData()
    formData.append('order', 'views')
    formData.append('ud', 'desc')
    formData.append('limit', 50000)
    const res = await fetch(txtUrl, {
      body: formData,
      method: 'post',
      headers: {
        cookie: 'PHPSESSID=u8mek3q94jkjb3drt0tae3es43',
      },
    })
    const page = await res.text()
    const $ = cheerio.load(page)
    const ids = []
    $('.list_tr2, .list_tr1').each((_, row) => {
      const funcname = $(row).find('td').attr('onclick')
      const id = Number(funcname.match(/\d+/)[0])
      ids.push(id)
    })
    fs.writeFileSync('../data/ids.json', JSON.stringify(ids))
  } catch (e) {
    console.error(e)
    return null
  }
}

getIdsByPopularity()
