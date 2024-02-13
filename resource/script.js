window.addEventListener('load', _ => {
  /**
   * バージョン
   */
  document.getElementById('version').innerText = '1.3.2'

  /**
   * エスケープ
   */
  const getEscapeTxt = str => {
    if (str == null) return null
    const rep = str
      // XSS対策
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      // カウンタ付リンク対策
      .replace(/\[/g, '［')
      .replace(/\]/g, '］')
      .replace(/\|/g, '｜')
      .trim()
    return rep
  }

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

  /**
   * モーダルの処理
   */
  const imageModalElm = document.getElementById('imageModal')
  imageModalElm.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const src = button.getAttribute('data-bs-src')
    const bodyHtml = (src) ? `<img src="${src}" class="img-fluid">` : ''
    imageModalElm.querySelector('.modal-body').innerHTML = bodyHtml
  })

  /**
   * スコア値の制御
   */
  const changeScore = elm => {
    elm.addEventListener('change', event => {
      const value = event.target.value
      const number = Number(value)
      event.target.value = (number < -100) ? -100 : (number > 100) ? 100 : number
    })
  }
  changeScore(document.querySelector('#scoreValue'))

  /**
   * スコア一括
   */
  document.getElementById('scoreSet').addEventListener('click', event => {
    const value = document.getElementById('scoreValue').value
    document.querySelectorAll('[id^="counterlink-no-"] [type="number"]').forEach(e => e.value = value)
  })

  /**
   * ファイルの読み込み
   */
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
        console.log('elmAry - elm:', elm)
        // URL
        const href = elm.getAttribute('href') || ''
        // インナーテキスト
        const innerText = getEscapeTxt(elm.innerText)
        // 画像
        const imgElm = elm.querySelector('img')
        const alt = getEscapeTxt(imgElm?.getAttribute('alt'))
        const src = imgElm?.getAttribute('src')
        // 双方なければ【テキストなし】
        const text = (alt) ? alt : (innerText) ? innerText : (src) ? '【テキストなし】' : ''
        // URLが相対パス、URLがない、タイトルがない、の場合はチェックしない
        const isNotPath = (/^(\.+)?\//.test(href))//(new RegExp(`^${origin}`).test(href))
        const isNotURL = (!href.length)
        const isNotHttp = (!/^http/.test(href))
        const isNotText = (!text.length)
        // ツールチップの内容
        const tooltip = (isNotPath) ? '⚠ 相対パスです' : (isNotURL) ? '⚠ パスがありません' : (isNotHttp) ? '⚠ URLではありません' : (isNotText) ? '⚠ タイトルがありません' : text
        const error = (tooltip != text) ? 'tooltip-danger' : 'tooltip-non'
        const isChecked = (tooltip != text) ? '' : 'checked'
        const object = { alt: alt, src: src, tooltip: tooltip, error: error, text: text, index: index, checked: isChecked, href: href }
        const imageButton = (alt == null) ? '' : `<button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#imageModal" $data-bs-alt="${alt}" data-bs-src="${src}" data-bs-href="${href}" >画像</button>`
        const HTML = `
        <div class="col-sm-12 col-md-6 col-lg-4 col-xxl-3 mb-3" id="counterlink-no-${index}">
          <div class="card h-100 bg-secondary">
            <div class="card-header d-flex justify-content-between p-0">
              <p class="m-0 py-2 px-3 text-truncate w-100" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${tooltip}" data-bs-custom-class="${error}">${text}</p>
              <input class="bg-transparent flex-shrink-0 form-check-input h2 m-0 rounded-0" type="checkbox" role="button" ${isChecked}>
            </div>
            <div class="card-body">
              <a href="${href}" target="_blank" class="card-text link-dark text-break">${href}</a>
            </div>
            <div class="card-footer border-top-0 pt-0 pb-3 bg-transparent d-flex flex-wrap justify-content-between">
              <div class="input-group mb-3">
                <span class="input-group-text border-end-0">タイトル</span>
                <textarea class="form-control" aria-label="${text}">${text}</textarea>
              </div>
              <div class="input-group w-75">
                <span class="input-group-text border-end-0">スコア値</span>
                <input type="number" class="form-control" id="counterlink-score-${index}"  min="-100" max="100" value="0">
              </div>
              ${imageButton}
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
      document.querySelectorAll('[id^="counterlink-no-"] input[type="checkbox"]').forEach(elm => {
        changeChecked({ target: elm })
        elm.addEventListener('change', event => changeChecked(event))
      })
      // スコアの処理
      document.querySelectorAll('[id^="counterlink-no-"] [type="number"]').forEach(elm => changeScore(elm))
      // ツールチップ
      const tooltipList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(elm => {
        if (elm.getAttribute('data-bs-title') !== '') new bootstrap.Tooltip(elm)
      })
    }
  })

  /**
   * ダウンロード
   */
  document.getElementById('download').addEventListener('click', event => {
    const checkAry = Array.from(document.querySelectorAll('[id^="counterlink-no-"] [type="checkbox"]')).map(elm => elm.checked)
    const titleAry = Array.from(document.querySelectorAll('[id^="counterlink-no-"] textarea')).map(elm => getEscapeTxt(elm.value))
    const scoreAry = Array.from(document.querySelectorAll('[id^="counterlink-no-"] [type="number"]')).map(elm => elm.value)
    // 保存したDOMをコピー
    const dom = htmlFileDom.getElementsByTagName('html')[0].cloneNode(true)
    // カウンタ付リンクに変換
    dom.querySelectorAll('a').forEach((elm, index) => {
      const href = elm.href
      // Todo　テキストボックスにかえる
      const text = titleAry[index]
      const isChecked = checkAry[index]
      const score = scoreAry[index]
      const webform = href.match(/secure-link\.jp\/wf\/\?c=(wf.+)/)
      if (!isChecked) return
      // Webフォームではない場合はlcにする
      const counterlink = (webform == null) ? `[[lc:${href}|${text}|${score}]]` : `[[wf:${webform[1]}|${text}|${score}]]`
      // wfの場合 &sskc=$dt_code$ が不要なので削除
      elm.href = (/\[\[wf:/.test(counterlink)) ? counterlink.replace(/&sskc=\$dt_code\$/, '') : counterlink
    })
    // HTMLに変換
    const outerHTML = dom.outerHTML
    // カウンタ付リンクにするURLに&amp;があると、&ではなく&amp;で処理されてしまうので置換
    const repOuterHTML = outerHTML.replace(/\[\[(lc|wf):(.*?)\|/g, (match, head, url) => `[[${head}:${url.replace(/&amp;/g, '&')}|`)
    const html = `<!DOCTYPE html>\n${repOuterHTML}`
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