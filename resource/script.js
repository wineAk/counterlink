window.addEventListener('load', _ => {
  /**
   * バージョン
   */
  document.getElementById('version').innerText = 'v1.0.0'

  /**
   * ☑外したら色を変える
   */
  const changeChecked = event => {
    const checkElm = event.target
    const cardElm = event.target.closest('.card')
    const cardClassName = 'bg-light-subtle'
    if (checkElm.checked) {
      cardElm.classList.add(cardClassName)
    } else {
      cardElm.classList.remove(cardClassName)
    }
  }
  document.querySelectorAll('[id^="counterlink-"]').forEach(elm => elm.addEventListener('change', event => changeChecked(event)))

  /**
   * ファイルの読み込み
   */
  const getTitle = elm => {
    const escape = str => {
      if (str == null) return null
      const rep = str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').trim()
      return rep
    }
    // テキスト
    const innerText = elm.innerText
    // 画像
    const alt = elm.querySelector('img')?.getAttribute('alt')
    // HTML
    const innerHTML = elm.innerHTML
    const text = escape(alt) || escape(innerText) || escape(innerHTML)
    return text
  }
  let htmlFileName = ''
  let htmlFileDom = null
  document.getElementById('file').addEventListener('change', event => {
    const files = event.target.files
    if (!files.length) return
    const file = files[0]
    const fileName = file.name
    if (!/\.html?$/.test(fileName)) {
      console.error('Not an HTML file.\n\nfile:', file)
      alert('HTMLファイルを選択してください')
      return
    }
    htmlFileName = fileName
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
      const html = reader.result
      const dom = new DOMParser().parseFromString(html, "text/html")
      const elmAry = Array.from(dom.querySelectorAll('a')).map((elm, index) => {
        // URL
        const href = elm.href
        // 画像
        const imgElm = elm.querySelector('img')
        const alt = imgElm?.getAttribute('alt')
        const src = imgElm?.getAttribute('src')
        const isModal = (alt == null) ? '' : `<img src="image/img.svg" class="my-auto ms-3" data-bs-toggle="modal" data-bs-target="#imageModal" data-bs-alt="${alt}" data-bs-src="${src}" data-bs-href="${href}" role="button"></img>`
        // 相対パス
        const location = window.location
        const origin = location.origin
        // タイトル
        const text = getTitle(elm)
        // URLが相対パス、URLがない、タイトルがない、の場合はチェックしない
        const isNotPath = (new RegExp(`^${origin}`).test(href))
        const isNotURL = (!href.length)
        const isNotText = (!text.length)
        const isChecked = (isNotPath || isNotURL || isNotText) ? '' : 'checked'
        // ツールチップの内容
        const tooltip = (isNotPath) ? '⚠ 相対パスです' : (isNotURL) ? '⚠ パスがありません' : (isNotText) ? '⚠ タイトルがありません' : text
        const error = (isNotPath || isNotURL || isNotText) ? 'tooltip-danger' : 'tooltip-non'
        const HTML = `
        <div class="col-sm-12 col-md-6 col-lg-4 col-xxl-3">
          <div class="bg-secondary card my-1 overflow-hidden">
            <div class="card-header d-flex h4 justify-content-between p-0">
              ${isModal}
              <p class="m-0 py-2 px-3 text-truncate w-100" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${tooltip}" data-bs-custom-class="${error}">${text}</p>
              <input class="bg-transparent flex-shrink-0 form-check-input h2 m-0 rounded-0" type="checkbox" id="counterlink-${index}" role="button" ${isChecked}>
            </div>
            <div class="card-body">
              <a href="${href}" target="_blank" class="card-text link-dark text-break">${href}</a>
            </div>
          </div>
        </div>`
        return HTML
      })
      if (!elmAry.length) {
        console.error('HTML file with no links.\n\nfile:', file)
        alert('変換が必要なリンクが1つも存在しないHTMLファイルです')
        return
      }
      const element = elmAry.join('\n')
      document.getElementById('counterLink').innerHTML = element
      document.getElementById('download').disabled = false
      // 読み込んだHTMLファイルのDOMを保持させる
      htmlFileDom = dom
      // チェックの処理
      document.querySelectorAll('[id^="counterlink-"]').forEach(elm => {
        changeChecked({ target: elm })
        elm.addEventListener('change', event => changeChecked(event))
      })
      // ツールチップ
      const tooltipList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(elm => {
        if (elm.getAttribute('data-bs-title') !== '') new bootstrap.Tooltip(elm)
      })
    }
  })

  /**
   * モーダルの処理
   */
  const imageModalElm = document.getElementById('imageModal')
  if (imageModalElm) {
    imageModalElm.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget
      const alt = button.getAttribute('data-bs-alt')
      const src = button.getAttribute('data-bs-src')
      const href = button.getAttribute('data-bs-href')
      imageModalElm.querySelector('img').src = src
      imageModalElm.querySelector('h1').innerText = alt
      imageModalElm.querySelector('a').innerText = href
    })
  }

  /**
   * ダウンロード
   */
  document.getElementById('download').addEventListener('click', event => {
    const checkedAry = Array.from(document.querySelectorAll('[id^="counterlink-"]')).map(elm => elm.checked)
    // 保存したDOMをコピー
    const dom = htmlFileDom.getElementsByTagName('html')[0].cloneNode(true)
    // カウンタ付リンクに変換
    dom.querySelectorAll('a').forEach((elm, index) => {
      const href = elm.href
      const text = getTitle(elm).replace(/[\[:|\]]/g, '')
      const isChecked = checkedAry[index]
      const webform = href.match(/secure-link\.jp\/wf\/\?c=(wf.+)/)
      if (!isChecked) return
      // Webフォームではない、もしくは差込みキーがある場合はlcにする
      //const counterlink = (webform == null || /\$(E-)?dt_(.*?)\$/.test(webform[1])) ? `[[lc:${href}|${text}]]` : `[[wf:${webform[1]}|${text}]]`
      // Webフォームではない場合はlcにする
      const counterlink = (webform == null) ? `[[lc:${href}|${text}]]` : `[[wf:${webform[1]}|${text}]]`
      // wfの場合 &sskc=$dt_code$ が不要なので削除
      elm.href = (/\[\[wf:/.test(counterlink)) ? counterlink.replace(/&sskc=\$dt_code\$/, '') : counterlink
    })
    // HTMLに変換
    const outerHTML = dom.outerHTML
    // カウンタ付リンクにするURLに&amp;があると、&ではなく&amp;で処理されてしまうので置換
    const repOuterHTML = outerHTML.replace(/\[\[(lc|wf):(.*?)\|/g, (match, head, url) => `[[${head}:${url.replace(/&amp;/g, '&')}|`)
    //console.log('👘 - document.getElementById - m:', m)
    const html = `<!DOCTYPE html>\n${repOuterHTML}`
    //const html = ('<!DOCTYPE html>\n' + dom.outerHTML).replace(/\[\[(lc|wf):(.*?)\|/g, '&')
    // Blobオブジェクトに変換
    const blob = new Blob([html], { type: 'text/html' })
    // URL作成
    const url = window.URL || window.webkitURL
    const blobUrl = url.createObjectURL(blob)
    const aElm = document.createElement('a')
    aElm.download = htmlFileName
    aElm.href = blobUrl
    aElm.click()
  })

})