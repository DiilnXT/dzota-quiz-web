'use client'

import { useState, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Check, X, RefreshCw, FileText, Trash2, Sparkles, BookOpen, Copy, ChevronDown, Upload } from 'lucide-react'
import { createQuestionGroup, addQuestionVariant } from '@/app/actions/question'

export default function WordImporter({ chapterId, onDone }: { chapterId: string, onDone: () => void }) {
  const [isParsing, setIsParsing] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [importFormatMode, setImportFormatMode] = useState('auto')
  const [showGuideModal, setShowGuideModal] = useState(false)
  const editorRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getDirectImageUrl = (url: string) => {
    if (typeof url !== 'string') return url
    const match = url.match(/id=([a-zA-Z0-9_-]+)/)
    if (url.includes('drive.google.com') && match) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`
    }
    return url
  }

  const isNonDefaultColor = (col: string | null) => {
    if (!col) return false
    const c = col.trim().toLowerCase().replace(/\s+/g, '')
    if (
      [
        'inherit', 'initial', 'unset', 'auto', 'windowtext', 'currentcolor',
        'transparent', 'none', 'black', '#000', '#000000', '#111', '#111111',
        '#222', '#222222', '#333', '#333333', '#334155', '#1e293b', '#0f172a',
        '#374151', '#475569', 'rgb(0,0,0)', 'rgb(30,41,59)', 'rgb(51,65,85)',
        'rgb(15,23,42)', 'rgb(34,34,34)', 'rgb(51,51,51)',
      ].includes(c)
    ) {
      return false
    }
    const hexMatch = c.match(/^#?([0-9a-f]{6})$/i)
    if (hexMatch) {
      const hex = hexMatch[1]
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if (r < 65 && g < 65 && b < 65 && Math.max(r, g, b) - Math.min(r, g, b) < 25) return false
    }
    return true
  }

  const isHighlightBgColor = (bg: string | null) => {
    if (!bg) return false
    const c = bg.trim().toLowerCase().replace(/\s+/g, '')
    return ![
      'inherit', 'initial', 'unset', 'transparent', 'none', 'white',
      '#fff', '#ffffff', 'rgb(255,255,255)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0)', 'auto',
    ].includes(c)
  }

  const loadExternalScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.onload = () => resolve()
      s.onerror = (e) => reject(e)
      document.head.appendChild(s)
    })
  }

  const convertDocxArrayBufferToRichHtml = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    if (!(window as any).JSZip) {
      try {
        await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')
      } catch {}
    }

    const JSZip = (window as any).JSZip
    if (JSZip) {
      try {
        const zip = await JSZip.loadAsync(arrayBuffer)
        const docFile = zip.file('word/document.xml')
        if (docFile) {
          const xmlParser = new DOMParser()
          const getLocalTag = (el: any) => (el && (el.localName || (el.nodeName ? el.nodeName.split(':').pop() : ''))) || ''
          const getAttr = (el: any, name: string) => {
            if (!el || !el.attributes) return null
            for (let i = 0; i < el.attributes.length; i++) {
              const a = el.attributes[i]
              if (a.name === name || a.localName === name || a.name.endsWith(':' + name)) return a.value
            }
            return null
          }
          const findChild = (parent: any, localName: string) => {
            if (!parent || !parent.childNodes) return null
            for (let i = 0; i < parent.childNodes.length; i++) {
              const ch = parent.childNodes[i]
              if (ch.nodeType === 1 && getLocalTag(ch) === localName) return ch
            }
            return null
          }
          const parseToggleProp = (rPr: any, propName: string) => {
            const node = findChild(rPr, propName)
            if (!node) return undefined
            const val = (getAttr(node, 'val') || '').trim().toLowerCase()
            if (val === '0' || val === 'false' || val === 'off' || val === 'none') return false
            return true
          }
          const parseRunFormatting = (rPr: any) => {
            if (!rPr) return {}
            let bold = parseToggleProp(rPr, 'b')
            if (bold === undefined) {
              const rFonts = findChild(rPr, 'rFonts')
              if (rFonts) {
                const fontName = (getAttr(rFonts, 'ascii') || getAttr(rFonts, 'hAnsi') || '').toLowerCase()
                if (/\b(bold|semibold|demibold|extrabold|black|heavy)\b/i.test(fontName) || /-(bold|semibold|black|heavy)$/i.test(fontName)) {
                  bold = true
                }
              }
            }
            const uNode = findChild(rPr, 'u')
            let underline: boolean | undefined = undefined
            if (uNode) {
              const uVal = (getAttr(uNode, 'val') || 'single').trim().toLowerCase()
              underline = !(uVal === 'none' || uVal === '0' || uVal === 'false' || uVal === 'off')
            }
            let color: string | undefined = undefined
            const colNode = findChild(rPr, 'color')
            if (colNode) {
              const cVal = (getAttr(colNode, 'val') || '').trim()
              if (cVal && cVal.toLowerCase() !== 'auto' && isNonDefaultColor('#' + cVal.replace(/^#/, ''))) {
                color = '#' + cVal.replace(/^#/, '')
              }
            }
            let highlight: boolean | undefined = undefined
            const hlNode = findChild(rPr, 'highlight')
            if (hlNode) {
              const hVal = (getAttr(hlNode, 'val') || '').trim().toLowerCase()
              if (hVal && hVal !== 'none' && hVal !== 'white') highlight = true
            }
            const shdNode = findChild(rPr, 'shd')
            if (!highlight && shdNode) {
              const fill = (getAttr(shdNode, 'fill') || '').trim().toLowerCase()
              if (fill && fill !== 'auto' && fill !== 'none' && fill !== 'ffffff' && fill !== '000000' && !/^f[0-9a-f]f[0-9a-f]f[0-9a-f]$/.test(fill)) {
                highlight = true
              }
            }
            const rStyleNode = findChild(rPr, 'rStyle')
            const rStyle = rStyleNode ? getAttr(rStyleNode, 'val') : null
            return { bold, underline, color, highlight, rStyle }
          }

          const stylesMap: Record<string, any> = {}
          const stylesFile = zip.file('word/styles.xml')
          if (stylesFile) {
            try {
              const stylesDoc = xmlParser.parseFromString(await stylesFile.async('string'), 'application/xml')
              const styleNodes = stylesDoc.getElementsByTagName('*')
              for (let i = 0; i < styleNodes.length; i++) {
                const sn = styleNodes[i]
                if (getLocalTag(sn) === 'style') {
                  const sId = getAttr(sn, 'styleId')
                  const basedOnNode = findChild(sn, 'basedOn')
                  const basedOn = basedOnNode ? getAttr(basedOnNode, 'val') : null
                  const rPr = findChild(sn, 'rPr')
                  if (sId) stylesMap[sId] = { basedOn, fmt: parseRunFormatting(rPr) }
                }
              }
            } catch {}
          }

          const resolveStyleFmt = (styleId: string | null, visited = new Set<string>()): any => {
            if (!styleId || !stylesMap[styleId] || visited.has(styleId)) return {}
            visited.add(styleId)
            const st = stylesMap[styleId]
            const baseFmt = st.basedOn ? resolveStyleFmt(st.basedOn, visited) : {}
            return {
              bold: st.fmt.bold !== undefined ? st.fmt.bold : baseFmt.bold,
              underline: st.fmt.underline !== undefined ? st.fmt.underline : baseFmt.underline,
              color: st.fmt.color !== undefined ? st.fmt.color : baseFmt.color,
              highlight: st.fmt.highlight !== undefined ? st.fmt.highlight : baseFmt.highlight,
            }
          }

          const numToAbstract: Record<string, string> = {}
          const numOverrides: Record<string, number> = {}
          const abstractLevels: Record<string, Record<string, any>> = {}
          const numFile = zip.file('word/numbering.xml')
          if (numFile) {
            try {
              const numDoc = xmlParser.parseFromString(await numFile.async('string'), 'application/xml')
              const allNumNodes = numDoc.getElementsByTagName('*')
              for (let i = 0; i < allNumNodes.length; i++) {
                const nn = allNumNodes[i]
                const tag = getLocalTag(nn)
                if (tag === 'abstractNum') {
                  const absId = getAttr(nn, 'abstractNumId')
                  if (absId) {
                    abstractLevels[absId] = {}
                    for (let j = 0; j < nn.childNodes.length; j++) {
                      const ch = nn.childNodes[j]
                      if (ch.nodeType === 1 && getLocalTag(ch) === 'lvl') {
                        const ilvl = getAttr(ch, 'ilvl') || '0'
                        const startNode = findChild(ch, 'start')
                        const fmtNode = findChild(ch, 'numFmt')
                        const txtNode = findChild(ch, 'lvlText')
                        const lvlRPr = findChild(ch, 'rPr')
                        abstractLevels[absId][ilvl] = {
                          start: parseInt((startNode && getAttr(startNode, 'val')) || '1', 10) || 1,
                          numFmt: (fmtNode && getAttr(fmtNode, 'val')) || 'decimal',
                          lvlText: (txtNode && getAttr(txtNode, 'val')) || '%1.',
                          fmt: parseRunFormatting(lvlRPr),
                        }
                      }
                    }
                  }
                } else if (tag === 'num') {
                  const nId = getAttr(nn, 'numId')
                  const absRef = findChild(nn, 'abstractNumId')
                  if (nId && absRef) numToAbstract[nId] = getAttr(absRef, 'val') || ''
                  for (let j = 0; j < nn.childNodes.length; j++) {
                    const ch = nn.childNodes[j]
                    if (ch.nodeType === 1 && getLocalTag(ch) === 'lvlOverride') {
                      const ilvl = getAttr(ch, 'ilvl') || '0'
                      const stOv = findChild(ch, 'startOverride')
                      if (nId && stOv) numOverrides[`${nId}_${ilvl}`] = parseInt(getAttr(stOv, 'val') || '1', 10) || 1
                    }
                  }
                }
              }
            } catch {}
          }

          const numCounters: Record<string, number> = {}
          const formatAutoNumber = (numId: string, ilvlStr: string) => {
            const absId = numToAbstract[numId]
            if (!absId || !abstractLevels[absId]) return null
            const ilvl = parseInt(ilvlStr || '0', 10) || 0
            const lvlInfo = abstractLevels[absId][String(ilvl)]
            if (!lvlInfo || lvlInfo.numFmt === 'bullet' || lvlInfo.numFmt === 'none') return null

            Object.keys(numCounters).forEach((k) => {
              const [kNum, kLvl] = k.split('_')
              if (kNum === String(numId) && parseInt(kLvl, 10) > ilvl) delete numCounters[k]
            })
            const counterKey = `${numId}_${ilvl}`
            if (numCounters[counterKey] === undefined) {
              numCounters[counterKey] = numOverrides[counterKey] !== undefined ? numOverrides[counterKey] : lvlInfo.start
            } else {
              numCounters[counterKey]++
            }
            const val = numCounters[counterKey]
            let formattedVal = String(val)
            if (lvlInfo.numFmt === 'upperLetter' || lvlInfo.numFmt === 'lowerLetter') {
              formattedVal = String.fromCharCode(64 + ((val - 1) % 26) + 1)
            }
            let labelStr = (lvlInfo.lvlText || '%1.').replace(`%${ilvl + 1}`, formattedVal).replace(/%\d+/g, formattedVal)
            if (!/[.):/\-]$/.test(labelStr)) labelStr += '.'
            return { text: labelStr + ' ', fmt: lvlInfo.fmt || {} }
          }

          const relsMedia: Record<string, string> = {}
          const relsFile = zip.file('word/_rels/document.xml.rels')
          if (relsFile) {
            try {
              const relsDoc = xmlParser.parseFromString(await relsFile.async('string'), 'application/xml')
              const relNodes = relsDoc.getElementsByTagName('*')
              for (let i = 0; i < relNodes.length; i++) {
                const rn = relNodes[i]
                if (getLocalTag(rn) === 'Relationship') {
                  const rId = getAttr(rn, 'Id')
                  const target = getAttr(rn, 'Target') || ''
                  if (rId && /media\//i.test(target)) {
                    const cleanPath = 'word/' + target.replace(/^\.?\/+/, '').replace(/^word\//i, '')
                    const imgEntry = zip.file(cleanPath)
                    if (imgEntry) {
                      const b64 = await imgEntry.async('base64')
                      const ext = (cleanPath.split('.').pop() || 'png').toLowerCase()
                      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/png'
                      relsMedia[rId] = `data:${mime};base64,${b64}`
                    }
                  }
                }
              }
            } catch {}
          }

          const escapeXmlHtml = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          const wrapFormattedHtml = (innerHtml: string, fmt: any) => {
            if (!innerHtml) return ''
            let out = innerHtml
            if (fmt.underline) out = `<u>${out}</u>`
            if (fmt.bold) out = `<strong>${out}</strong>`
            const styles: string[] = []
            if (fmt.color) styles.push(`color: ${fmt.color}`)
            if (fmt.highlight) styles.push(`background-color: #fef08a`)
            if (styles.length > 0) {
              out = fmt.highlight ? `<mark style="${styles.join('; ')}">${out}</mark>` : `<span style="${styles.join('; ')}">${out}</span>`
            }
            return out
          }

          const docXml = xmlParser.parseFromString(await docFile.async('string'), 'application/xml')
          const bodyNodes = docXml.getElementsByTagName('*')
          let wBody: any = null
          for (let i = 0; i < bodyNodes.length; i++) {
            if (getLocalTag(bodyNodes[i]) === 'body') { wBody = bodyNodes[i]; break }
          }

          const renderRunContainer = (node: any, pStyleFmt: any, pShadeHighlight: boolean): string => {
            let html = ''
            for (let i = 0; i < node.childNodes.length; i++) {
              const ch = node.childNodes[i]
              if (ch.nodeType !== 1) continue
              const tag = getLocalTag(ch)
              if (tag === 'r') {
                const rPr = findChild(ch, 'rPr')
                const directFmt = parseRunFormatting(rPr)
                const charStyleFmt = directFmt.rStyle ? resolveStyleFmt(directFmt.rStyle) : {}
                let effectiveBold = directFmt.bold
                if (effectiveBold === undefined) effectiveBold = charStyleFmt.bold
                if (effectiveBold === undefined) effectiveBold = pStyleFmt.bold

                const effectiveFmt = {
                  bold: Boolean(effectiveBold),
                  underline: Boolean(directFmt.underline !== undefined ? directFmt.underline : (charStyleFmt.underline !== undefined ? charStyleFmt.underline : pStyleFmt.underline)),
                  color: directFmt.color || charStyleFmt.color || pStyleFmt.color || '',
                  highlight: Boolean(directFmt.highlight || charStyleFmt.highlight || pStyleFmt.highlight || pShadeHighlight),
                }

                let runInner = ''
                for (let j = 0; j < ch.childNodes.length; j++) {
                  const rChild = ch.childNodes[j]
                  if (rChild.nodeType !== 1) continue
                  const rTag = getLocalTag(rChild)
                  if (rTag === 't' || rTag === 'delText') runInner += escapeXmlHtml(rChild.textContent || '')
                  else if (rTag === 'tab') runInner += '\t'
                  else if (rTag === 'br' || rTag === 'cr') runInner += '<br/>'
                  else if (rTag === 'drawing' || rTag === 'pict' || rTag === 'object') {
                    const subAll = rChild.getElementsByTagName('*')
                    for (let k = 0; k < subAll.length; k++) {
                      const sn = subAll[k]
                      const sTag = getLocalTag(sn)
                      if (sTag === 'blip' || sTag === 'imagedata') {
                        const embedId = getAttr(sn, 'embed') || getAttr(sn, 'id')
                        if (embedId && relsMedia[embedId]) runInner += `<img src="${relsMedia[embedId]}" />`
                      }
                    }
                  }
                }
                html += wrapFormattedHtml(runInner, effectiveFmt)
              } else if (tag === 'oMath' || tag === 'oMathPara') {
                const mathText = (ch.textContent || '').trim()
                if (mathText) html += wrapFormattedHtml(escapeXmlHtml(mathText), { bold: Boolean(pStyleFmt.bold), highlight: pShadeHighlight })
              } else if (['hyperlink', 'ins', 'smartTag', 'sdt', 'sdtContent', 'fldSimple'].includes(tag)) {
                html += renderRunContainer(ch, pStyleFmt, pShadeHighlight)
              }
            }
            return html
          }

          const renderParagraph = (pNode: any, cellShadeHighlight = false): string => {
            const pPr = findChild(pNode, 'pPr')
            let pStyleFmt: any = {}
            let pMarkFmt: any = {}
            let pShadeHighlight = cellShadeHighlight
            let autoListPrefixHtml = ''

            if (pPr) {
              const pStyleNode = findChild(pPr, 'pStyle')
              if (pStyleNode) pStyleFmt = resolveStyleFmt(getAttr(pStyleNode, 'val'))
              const pRPr = findChild(pPr, 'rPr')
              if (pRPr) pMarkFmt = parseRunFormatting(pRPr)
              const pShd = findChild(pPr, 'shd')
              if (pShd) {
                const fill = (getAttr(pShd, 'fill') || '').trim().toLowerCase()
                if (fill && fill !== 'auto' && fill !== 'none' && fill !== 'ffffff' && fill !== '000000' && !/^f[0-9a-f]f[0-9a-f]f[0-9a-f]$/.test(fill)) {
                  pShadeHighlight = true
                }
              }
              const numPr = findChild(pPr, 'numPr')
              if (numPr) {
                const numIdNode = findChild(numPr, 'numId')
                const ilvlNode = findChild(numPr, 'ilvl')
                const numId = numIdNode ? getAttr(numIdNode, 'val') : null
                const ilvl = ilvlNode ? getAttr(ilvlNode, 'val') || '0' : '0'
                if (numId && numId !== '0') {
                  const autoNum = formatAutoNumber(numId, ilvl)
                  if (autoNum) {
                    const lblFmt = {
                      bold: Boolean(pMarkFmt.bold !== undefined ? pMarkFmt.bold : autoNum.fmt.bold),
                      underline: Boolean(pMarkFmt.underline !== undefined ? pMarkFmt.underline : autoNum.fmt.underline),
                      color: pMarkFmt.color || autoNum.fmt.color || '',
                      highlight: Boolean(pMarkFmt.highlight || pShadeHighlight),
                    }
                    autoListPrefixHtml = wrapFormattedHtml(escapeXmlHtml(autoNum.text), lblFmt)
                  }
                }
              }
            }

            const bodyHtml = renderRunContainer(pNode, pStyleFmt, pShadeHighlight)
            if (!bodyHtml.trim() && !bodyHtml.includes('<img')) return ''
            return `<p>${autoListPrefixHtml}${bodyHtml}</p>`
          }

          const renderBlockList = (containerNode: any): string => {
            let out = ''
            if (!containerNode || !containerNode.childNodes) return out
            for (let i = 0; i < containerNode.childNodes.length; i++) {
              const node = containerNode.childNodes[i]
              if (node.nodeType !== 1) continue
              const tag = getLocalTag(node)
              if (tag === 'p') out += renderParagraph(node, false)
              else if (tag === 'tbl') {
                let tblHtml = '<table><tbody>'
                for (let r = 0; r < node.childNodes.length; r++) {
                  const tr = node.childNodes[r]
                  if (tr.nodeType !== 1 || getLocalTag(tr) !== 'tr') continue
                  tblHtml += '<tr>'
                  for (let c = 0; c < tr.childNodes.length; c++) {
                    const tc = tr.childNodes[c]
                    if (tc.nodeType !== 1 || getLocalTag(tc) !== 'tc') continue
                    let cellInner = ''
                    for (let pIdx = 0; pIdx < tc.childNodes.length; pIdx++) {
                      const cChild = tc.childNodes[pIdx]
                      if (cChild.nodeType === 1 && getLocalTag(cChild) === 'p') cellInner += renderParagraph(cChild, false)
                    }
                    tblHtml += `<td>${cellInner}</td>`
                  }
                  tblHtml += '</tr>'
                }
                tblHtml += '</tbody></table>'
                out += tblHtml
              } else if (tag === 'sdt' || tag === 'sdtContent') {
                out += renderBlockList(node)
              }
            }
            return out
          }

          if (wBody) {
            const richHtml = renderBlockList(wBody)
            if (richHtml.trim()) return richHtml
          }
        }
      } catch (e) {
        console.warn('OOXML fallback:', e)
      }
    }

    if (!(window as any).mammoth) {
      await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js')
    }
    const result = await (window as any).mammoth.convertToHtml({
      arrayBuffer,
      styleMap: ['u => u', 'b => strong', 'i => em'],
    })
    return result.value || ''
  }

  const handleDocxFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Vui lòng chọn file Word định dạng .docx!')
      return
    }
    try {
      setIsParsing(true)
      const arrayBuffer = await file.arrayBuffer()
      const html = await convertDocxArrayBufferToRichHtml(arrayBuffer)
      if (editorRef.current) {
        editorRef.current.setContent(html)
        setTimeout(() => {
          parseQuiz()
        }, 180)
      } else {
        setIsParsing(false)
      }
    } catch (err: any) {
      setIsParsing(false)
      alert('Lỗi đọc file Word: ' + (err.message || 'Không xác định'))
    }
  }

  const parseDomToLines = (rootNode: any) => {
    const lines: any[] = []
    let currentLine: any = { text: '', segments: [], images: [] }

    const flushLine = () => {
      if (currentLine.text.trim().length > 0 || currentLine.images.length > 0) {
        lines.push(currentLine)
      }
      currentLine = { text: '', segments: [], images: [] }
    }

    const isBlock = (node: any) => ['DIV', 'P', 'LI', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TR', 'TD', 'TH'].includes(node.nodeName)

    const detectNodeFormat = (startEl: any) => {
      let isBold = false
      let isUnderline = false
      let isHighlight = false
      let detectedColor = ''
      let parent = startEl
      while (parent && parent !== rootNode) {
        const tag = parent.tagName || ''
        const style = (parent.getAttribute ? (parent.getAttribute('style') || '') : '').toLowerCase()
        if (
          tag === 'B' || tag === 'STRONG' || /^H[1-6]$/.test(tag) ||
          /font-weight\s*:\s*(bold|bolder|[6-9]\d\d)/i.test(style) ||
          /mso-bidi-font-weight\s*:\s*bold/i.test(style)
        ) {
          isBold = true
        }
        if (tag === 'U' || tag === 'INS' || /text-decoration(?:-line)?\s*:[^;]*underline/i.test(style)) {
          isUnderline = true
        }
        if (tag === 'MARK' || (parent.getAttribute && parent.getAttribute('data-dzota-hl') === '1')) {
          isHighlight = true
        } else {
          const bgMatch = style.match(/(?:^|;\s*)background(?:-color)?\s*:\s*([^;]+)/i)
          if (bgMatch && isHighlightBgColor(bgMatch[1])) isHighlight = true
        }
        if (!detectedColor) {
          const colorMatch = style.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i)
          if (colorMatch && isNonDefaultColor(colorMatch[1])) {
            detectedColor = colorMatch[1].trim().toLowerCase()
          } else if (parent.getAttribute && parent.getAttribute('color') && isNonDefaultColor(parent.getAttribute('color'))) {
            detectedColor = parent.getAttribute('color').trim().toLowerCase()
          }
        }
        parent = parent.parentElement
      }
      return { isBold, isUnderline, isHighlight, detectedColor }
    }

    const walk = (node: any) => {
      if (node.nodeName === 'IMG') {
        if (node.src) currentLine.images.push(getDirectImageUrl(node.src))
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\u00A0/g, ' ')
        if (text.length === 0) return
        const fmt = detectNodeFormat(node.parentElement)
        currentLine.text += text
        currentLine.segments.push({
          text,
          bold: fmt.isBold,
          underline: fmt.isUnderline,
          highlight: fmt.isHighlight,
          color: fmt.detectedColor,
        })
      } else if (node.nodeName === 'BR') {
        flushLine()
      } else if (node.nodeName === 'OL' || node.nodeName === 'UL') {
        flushLine()
        const liChildren = Array.from(node.children || []).filter((c: any) => c.nodeName === 'LI')
        const olType = (node.getAttribute && (node.getAttribute('type') || '')) || ''
        const olStyle = (node.getAttribute && (node.getAttribute('style') || '').toLowerCase()) || ''
        const isAlphaList = node.nodeName === 'OL' && (
          olType === 'A' || olType === 'a' ||
          olStyle.includes('upper-alpha') || olStyle.includes('lower-alpha') ||
          (liChildren.length >= 2 && liChildren.length <= 7)
        )
        let liIdx = 0
        for (let i = 0; i < node.childNodes.length; i++) {
          const ch = node.childNodes[i]
          if (ch.nodeName === 'LI') {
            const rawLiText = (ch.textContent || '').trim()
            const alreadyHasPrefix = /^[-*•~]?\s*(?:\*\*)?(?:\[|\()?\s*[A-G]\s*(?:\]|\))?[\s.):\/*-]+/i.test(rawLiText) || /^(?:Câu|Bài|\d+[\s.:)])/i.test(rawLiText)
            let prefix: string | null = null
            if (!alreadyHasPrefix && node.nodeName === 'OL') {
              prefix = isAlphaList && liIdx < 7 ? String.fromCharCode(65 + liIdx) + '. ' : (liIdx + 1) + '. '
            }
            liIdx++
            flushLine()
            if (prefix) {
              const liFmt = detectNodeFormat(ch)
              currentLine.text += prefix
              currentLine.segments.push({
                text: prefix,
                bold: liFmt.isBold,
                underline: liFmt.isUnderline,
                highlight: liFmt.isHighlight,
                color: liFmt.detectedColor,
              })
            }
            for (let k = 0; k < ch.childNodes.length; k++) walk(ch.childNodes[k])
            flushLine()
          } else {
            walk(ch)
          }
        }
        flushLine()
      } else {
        const isBlk = isBlock(node)
        if (isBlk) flushLine()
        for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i])
        if (isBlk) flushLine()
      }
    }

    walk(rootNode)
    flushLine()
    return lines
  }

  const sliceLineObj = (lineObj: any, startIdx: number, endIdx: number): any => {
    const segments: any[] = []
    let cursor = 0
    for (const seg of lineObj.segments || []) {
      const segStart = cursor
      const segEnd = cursor + seg.text.length
      cursor = segEnd
      if (segEnd <= startIdx || segStart >= endIdx) continue
      const cutStart = Math.max(0, startIdx - segStart)
      const cutEnd = Math.min(seg.text.length, endIdx - segStart)
      const subText = seg.text.slice(cutStart, cutEnd)
      if (subText.length > 0) segments.push({ ...seg, text: subText })
    }
    const rawSlice = (lineObj.text || '').slice(startIdx, endIdx)
    const leadLen = (rawSlice.match(/^\s+/) || [''])[0].length
    const trailMatch = rawSlice.match(/\s+$/)
    const trailLen = trailMatch && trailMatch[0].length < rawSlice.length ? trailMatch[0].length : 0
    if (leadLen > 0 || trailLen > 0) {
      return sliceLineObj({ text: rawSlice, segments, images: [] }, leadLen, rawSlice.length - trailLen)
    }
    return { text: rawSlice, segments, images: lineObj.images || [] }
  }

  const trimLineObj = (lineObj: any) => {
    const raw = lineObj.text || ''
    const lead = (raw.match(/^\s+/) || [''])[0].length
    const trail = (raw.match(/\s+$/) || [''])[0].length
    if (lead + trail >= raw.length) return { text: '', segments: [], images: lineObj.images || [] }
    if (lead === 0 && trail === 0) return lineObj
    return sliceLineObj(lineObj, lead, raw.length - trail)
  }

  const extractQuestionHeader = (lineText: string, optMatch: any, currentCounter: number) => {
    if (optMatch) return null
    const trimmed = (lineText || '').trim()
    if (!trimmed) return null
    if (/^[-*_]{3,}$/.test(trimmed)) return null

    let m = trimmed.match(/^(?:#{1,6}\s*)?(?:\*\*)?(?:\[\s*)?(?:Câu(?:\s*hỏi)?|Bài|Question)\s*(\d+)[\s.:)\]*-]+(.*)$/i)
    if (m) {
      const qNum = m[1]
      let qText = (m[2] || '').trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\]$/, '').trim()
      if (/^\[(.*)\]$/.test(qText) && !qText.includes('][') && !qText.includes('],[')) {
        qText = qText.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim()
      }
      return { number: qNum, text: qText }
    }

    m = trimmed.match(/^(?:#{1,6}\s*)?(?:\[\s*)?(\d+)[\s.:)\/*\]-]+(?!\s*[A-G][\s.):\/*])(.*)$/i)
    if (m) {
      const qNum = m[1]
      let qText = (m[2] || '').trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\]$/, '').trim()
      if (/^\[(.*)\]$/.test(qText) && !qText.includes('][') && !qText.includes('],[')) {
        qText = qText.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim()
      }
      return { number: qNum, text: qText }
    }

    m = trimmed.match(/^\[\s*(.*?)\s*\]$/)
    if (m && m[1].length > 2) {
      const inner = m[1].trim()
      const numInBracket = inner.match(/(?:câu|bài)\s*(\d+)/i) || inner.match(/^(\d+)[\s.:]+/)
      const qNum = numInBracket ? numInBracket[1] : String((currentCounter || 0) + 1)
      let qText = inner
      if (numInBracket) {
        qText = inner.replace(/(?:\[\s*)?(?:Câu|Bài)\s*\d+[\s.:\]*-]*/i, '').replace(/^\d+[\s.:\/*-]+/, '').trim()
      }
      return { number: qNum, text: qText || inner }
    }

    return null
  }

  const extractOptionMatch = (lineText: string) => {
    if (!lineText) return null
    return lineText.match(/^[-*•~]?\s*(?:\*\*)?(?:\[|\()?\s*([A-G])\s*(?:\]|\))?[\s.):\/*-]+(?:\*\*)?\s*(.*)$/i)
  }

  const checkOptionAttributes = (lineObj: any, label: string) => {
    const trimmedObj = trimLineObj(lineObj)
    const lineText = trimmedObj.text || ''
    const segments = trimmedObj.segments || []

    const prefixMatch = lineText.match(/^[-*•~]?\s*(?:\*\*)?(?:\[|\()?\s*[A-G]\s*(?:\]|\))?[\s.):\/*-]+(?:\*\*)?\s*/i)
    const prefixLen = prefixMatch ? prefixMatch[0].length : 0

    const isLineWrappedInBold =
      (lineText.startsWith('**') && lineText.endsWith('**') && lineText.length > 4) ||
      (lineText.startsWith('__') && lineText.endsWith('__') && lineText.length > 4)
    const isLetterBoldInText =
      /^\s*[*_]{2}\s*(?:\(|\[)?[A-G]/i.test(lineText) ||
      /^\s*[*_]{1,2}\s*[A-G]\s*[*_]{1,2}[\s.):\/*-]+/i.test(lineText)
    const isContentBoldInText =
      /^\s*[-*•~]?\s*(?:\*\*)?(?:\(|\[)?[A-G](?:\)|\])?[\s.):\/*-]+(?:\*\*)?\s*[*_]{2}(.+)[*_]{2}\s*$/i.test(lineText)

    let hasBoldLetterSeg = false
    let hasUnderlineLetterSeg = false
    let totalContentChars = 0
    let boldContentChars = 0
    let underlineContentChars = 0
    let highlightChars = 0
    let detectedColor = ''

    let cursor = 0
    for (const seg of segments) {
      const segStart = cursor
      const segEnd = cursor + seg.text.length
      cursor = segEnd

      const nonWsAll = seg.text.replace(/\s+/g, '').length
      if (seg.highlight) highlightChars += nonWsAll
      if (!detectedColor && seg.color && isNonDefaultColor(seg.color)) detectedColor = seg.color

      if (segStart < prefixLen) {
        const pPart = seg.text.slice(0, Math.min(seg.text.length, prefixLen - segStart))
        if (/[A-G]/i.test(pPart)) {
          if (seg.bold) hasBoldLetterSeg = true
          if (seg.underline) hasUnderlineLetterSeg = true
        }
      }

      if (segEnd > prefixLen) {
        const cStart = Math.max(0, prefixLen - segStart)
        const cPart = seg.text.slice(cStart)
        const cLen = cPart.replace(/\s+/g, '').length
        if (cLen > 0) {
          totalContentChars += cLen
          if (seg.bold) boldContentChars += cLen
          if (seg.underline) underlineContentChars += cLen
        }
      }
    }

    if (isLineWrappedInBold || isContentBoldInText) {
      boldContentChars = Math.max(boldContentChars, totalContentChars || 1)
      totalContentChars = Math.max(totalContentChars, 1)
    }

    const boldContentRatio = totalContentChars > 0 ? boldContentChars / totalContentChars : 0
    const underlineContentRatio = totalContentChars > 0 ? underlineContentChars / totalContentChars : 0

    const hasBoldLetter = isLineWrappedInBold || isLetterBoldInText || hasBoldLetterSeg
    const hasAnyBoldContent = boldContentChars > 0 || isLineWrappedInBold || isContentBoldInText
    const isFullContentBold =
      isLineWrappedInBold ||
      isContentBoldInText ||
      (totalContentChars > 0 && boldContentRatio >= 0.55) ||
      (totalContentChars === 0 && hasBoldLetter)

    return {
      label,
      isBold: hasBoldLetter || hasAnyBoldContent,
      hasBoldLetter,
      hasAnyBoldContent,
      isFullContentBold,
      boldContentRatio,
      hasHighlight: highlightChars > 0,
      hasColor: Boolean(detectedColor),
      color: detectedColor,
      isFullContentUnderline: totalContentChars > 0 && underlineContentRatio >= 0.55,
      isUnderline: underlineContentChars > 0 || hasUnderlineLetterSeg || /<u>/i.test(lineText),
      hasAsterisk: /^\s*\*(?!\*)\s*(?:\(|\[)?[A-G][\s.):\/*-]+/i.test(lineText),
      hasExplicitTag: /\((?:đúng|đáp án đúng|chính xác|correct|true)\)|\[x\]/i.test(lineText),
    }
  }

  const resolveBoldWinner = (optKeys: string[], optAttrsMap: Record<string, any>) => {
    const fullContentBoldKeys = optKeys.filter((k) => optAttrsMap[k]?.isFullContentBold)
    if (fullContentBoldKeys.length === 1) return fullContentBoldKeys[0]

    if (fullContentBoldKeys.length > 1 && fullContentBoldKeys.length < optKeys.length) {
      const sorted = [...optKeys].sort((a, b) => (optAttrsMap[b]?.boldContentRatio || 0) - (optAttrsMap[a]?.boldContentRatio || 0))
      const r1 = optAttrsMap[sorted[0]]?.boldContentRatio || 0
      const r2 = optAttrsMap[sorted[1]]?.boldContentRatio || 0
      if (r1 >= 0.85 && r1 - r2 >= 0.35) return sorted[0]
    }

    const boldLetterKeys = optKeys.filter((k) => optAttrsMap[k]?.hasBoldLetter)
    if (boldLetterKeys.length === 1) return boldLetterKeys[0]

    const anyBoldContentKeys = optKeys.filter((k) => optAttrsMap[k]?.hasAnyBoldContent)
    if (anyBoldContentKeys.length === 1) return anyBoldContentKeys[0]

    const rawBoldKeys = optKeys.filter((k) => optAttrsMap[k]?.isBold)
    if (rawBoldKeys.length === 1) return rawBoldKeys[0]
    return null
  }

  const finalizeQuestion = (q: any, optAttrsMap: Record<string, any>, formatMode: string, answerMap: Record<string, string>) => {
    if (!q) return
    if (q.correct && /^[A-G]$/i.test(q.correct)) return
    const qNum = String(q.number)
    const optKeys = Object.keys(q.options).filter((k) => q.options[k] && q.options[k].trim())
    if (optKeys.length === 0) return

    if (formatMode === 'key_table') {
      if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum]
      return
    }
    if (formatMode === 'bold' || formatMode === 'bold_letter') {
      if (formatMode === 'bold_letter') {
        const bl = optKeys.filter((k) => optAttrsMap[k]?.hasBoldLetter)
        if (bl.length === 1) { q.correct = bl[0]; return }
      }
      const winner = resolveBoldWinner(optKeys, optAttrsMap)
      if (winner) q.correct = winner
      else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum]
      return
    }
    if (formatMode === 'color') {
      const hl = optKeys.filter((k) => optAttrsMap[k]?.hasHighlight)
      if (hl.length === 1) { q.correct = hl[0]; return }
      const ck = optKeys.filter((k) => optAttrsMap[k]?.hasColor)
      if (ck.length === 1) { q.correct = ck[0]; return }
      if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum]
      return
    }
    if (formatMode === 'underline') {
      const fu = optKeys.filter((k) => optAttrsMap[k]?.isFullContentUnderline)
      if (fu.length === 1) { q.correct = fu[0]; return }
      const uKey = optKeys.filter((k) => optAttrsMap[k]?.isUnderline)
      if (uKey.length === 1) q.correct = uKey[0]
      else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum]
      return
    }
    if (formatMode === 'asterisk') {
      const astKey = optKeys.find((k) => optAttrsMap[k]?.hasAsterisk)
      if (astKey) q.correct = astKey
      else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum]
      return
    }

    const tagKey = optKeys.find((k) => optAttrsMap[k]?.hasExplicitTag)
    if (tagKey) { q.correct = tagKey; return }

    const astKey = optKeys.find((k) => optAttrsMap[k]?.hasAsterisk)
    if (astKey) { q.correct = astKey; return }

    const hlKeys = optKeys.filter((k) => optAttrsMap[k]?.hasHighlight)
    if (hlKeys.length === 1) { q.correct = hlKeys[0]; return }

    const coloredKeys = optKeys.filter((k) => optAttrsMap[k]?.hasColor)
    if (coloredKeys.length === 1) {
      q.correct = coloredKeys[0]
      return
    } else if (coloredKeys.length > 1 && coloredKeys.length < optKeys.length) {
      const colorCounts: Record<string, number> = {}
      optKeys.forEach((k) => {
        const col = optAttrsMap[k]?.color || 'default'
        colorCounts[col] = (colorCounts[col] || 0) + 1
      })
      const majorityCol = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a])[0]
      const minorityKey = optKeys.find((k) => (optAttrsMap[k]?.color || 'default') !== majorityCol && optAttrsMap[k]?.hasColor)
      if (minorityKey) { q.correct = minorityKey; return }
    }

    const fullU = optKeys.filter((k) => optAttrsMap[k]?.isFullContentUnderline)
    if (fullU.length === 1) { q.correct = fullU[0]; return }
    const uKeys = optKeys.filter((k) => optAttrsMap[k]?.isUnderline)
    if (uKeys.length === 1) { q.correct = uKeys[0]; return }

    const boldWinner = resolveBoldWinner(optKeys, optAttrsMap)
    if (boldWinner) { q.correct = boldWinner; return }

    if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum]
  }

  const parseQuiz = async () => {
    if (!editorRef.current) return
    setIsParsing(true)

    try {
      await editorRef.current.uploadImages()
    } catch {}

    const editorBody = editorRef.current.getBody()

    try {
      const lines = parseDomToLines(editorBody)
      const questions: any[] = []
      let currentQ: any = null
      let currentQOptAttrs: Record<string, any> = {}
      let qCounter = 0
      const fullText = lines.map((l) => l.text).join('\n')
      const answerMap: Record<string, string> = {}

      try {
        const tables = editorBody.querySelectorAll ? Array.from(editorBody.querySelectorAll('table')) : []
        tables.forEach((tbl: any) => {
          const rows = Array.from(tbl.querySelectorAll('tr')) as any[]
          for (let r = 0; r < rows.length; r++) {
            const cells = Array.from(rows[r].querySelectorAll('td, th')).map((c: any) => (c.textContent || '').trim())
            cells.forEach((txt) => {
              const m = txt.match(/^(?:Câu\s*)?(\d+(?:\.\d+)?)[\s.:/\-]+([A-G])$/i)
              if (m) answerMap[m[1]] = m[2].toUpperCase()
            })
            if (r + 1 < rows.length) {
              const nextCells = Array.from(rows[r + 1].querySelectorAll('td, th')).map((c: any) => (c.textContent || '').trim())
              if (cells.length >= 2 && cells.length === nextCells.length) {
                for (let c = 0; c < cells.length; c++) {
                  const qm = cells[c].match(/^(?:Câu\s*)?(\d+(?:\.\d+)?)$/i)
                  const am = nextCells[c].match(/^([A-G])$/i)
                  if (qm && am) answerMap[qm[1]] = am[1].toUpperCase()
                }
              }
            }
          }
        })
        const keyMatch = fullText.match(/(?:^|\n)\s*(?:Bảng đáp án|Đáp án đề thi|Answer Key|ĐÁP ÁN)[:\s]*([\s\S]*)$/i)
        if (keyMatch) {
          for (const match of keyMatch[1].matchAll(/(?:Câu\s*)?(\d+(?:\.\d+)?)[\s.:/\-]*([A-G])(?:\b|\.|\s|,|;|$)/gi)) {
            answerMap[match[1]] = match[2].toUpperCase()
          }
        }
      } catch {}

      const isAnswerTableHeading = (txt: string) =>
        /^(?:BẢNG ĐÁP ÁN(?:\s+NGÂN HÀNG CÂU HỎI)?|ĐÁP ÁN ĐỀ THI|ANSWER KEY)$/i.test((txt || '').trim())

      const isExamEndSeparator = (txt: string) => {
        const t = (txt || '').trim()
        if (/^[-—–=_*~•\s]*HẾT(?:\s+ĐỀ(?:\s+THI)?)?[-—–=_*~•\s.!]*$/i.test(t)) return true
        if (/^\(?\s*(?:Cán bộ coi thi|Giám thị(?:\s+coi thi)?)\s+không\s+giải\s+thích/i.test(t)) return true
        return false
      }

      const extractInlineOptionMatches = (lineText: string, expectedStartLetter = 'A') => {
        if (!lineText) return []
        const multiOptRegex = /(?:^|[\s\t])(?:[*_]{0,2})(?:\(|\[)?([A-G])(?:\)|\])?\s*([.):/])(?:[*_]{0,2})/g
        const rawMatches: any[] = []
        let mm
        while ((mm = multiOptRegex.exec(lineText)) !== null) {
          const leadWsStr = (mm[0].match(/^[\s\t]+/) || [''])[0]
          rawMatches.push({
            letter: mm[1].toUpperCase(),
            delim: mm[2],
            leadWsStr,
            index: mm.index + leadWsStr.length,
            endOfPrefix: mm.index + mm[0].length,
          })
        }
        if (rawMatches.length < 2) return []

        const trimmedLine = lineText.trim()
        const firstCand = rawMatches[0]
        const afterFirst = lineText.slice(firstCand.endOfPrefix).trim()
        const usesCapitalizedStyle = /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ0-9(\[\"'*+-]/.test(
          firstCand.index === 0 ? afterFirst : trimmedLine
        )

        const isMidSentenceBinomialAbbrev = (m: any) => {
          if (m.index === 0) return false
          if (m.delim !== '.') return false
          if (/[\t]| {2,}/.test(m.leadWsStr)) return false
          const after = lineText.slice(m.endOfPrefix)
          if (usesCapitalizedStyle && /^\s*[a-z]{3,}\b/.test(after)) return true
          return false
        }

        const filtered = rawMatches.filter((m) => !isMidSentenceBinomialAbbrev(m))
        if (filtered.length < 2) return []

        const seq: any[] = []
        let expectedCode = expectedStartLetter.charCodeAt(0)
        for (const m of filtered) {
          if (m.letter.charCodeAt(0) === expectedCode) {
            if (seq.length > 0) {
              const prev = seq[seq.length - 1]
              const prevContent = lineText.slice(prev.endOfPrefix, m.index).trim()
              if (!prevContent) continue
            }
            seq.push(m)
            expectedCode++
          }
        }
        return seq.length >= 2 ? seq : []
      }

      const getNextExpectedOptionLetter = (q: any) => {
        if (!q) return 'A'
        const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        let lastFilledIdx = -1
        for (let k = 0; k < keys.length; k++) {
          if (q.options[keys[k]] !== '') lastFilledIdx = k
        }
        return lastFilledIdx + 1 < keys.length ? keys[lastFilledIdx + 1] : 'G'
      }

      let reachedAnswerKeyFooter = false

      const flushCurrentQ = () => {
        if (!currentQ) return
        finalizeQuestion(currentQ, currentQOptAttrs, importFormatMode, answerMap)
        questions.push(currentQ)
        currentQ = null
        currentQOptAttrs = {}
      }

      for (let i = 0; i < lines.length; i++) {
        const lineObj = trimLineObj(lines[i])
        const lineText = lineObj.text
        if (!lineText && lineObj.images.length === 0) continue

        if (isAnswerTableHeading(lineText)) {
          reachedAnswerKeyFooter = true
          flushCurrentQ()
          break
        }
        if (reachedAnswerKeyFooter) break

        if (isExamEndSeparator(lineText)) {
          flushCurrentQ()
          continue
        }

        const inlineAnsMatch = lineText.match(/^(?:Đáp án(?:\s*đúng)?|Chọn(?:\s*đáp án)?|Answer(?:\s*Key)?)[\s.:=*-]+([A-G])\b/i)
        if (inlineAnsMatch && currentQ) {
          currentQ.correct = inlineAnsMatch[1].toUpperCase()
          continue
        }

        const expectedOptLetter = getNextExpectedOptionLetter(currentQ)
        const multiMatches = extractInlineOptionMatches(lineText, expectedOptLetter)
        const optMatch = multiMatches.length === 0 ? extractOptionMatch(lineText) : null
        const qHeader = !optMatch ? extractQuestionHeader(lineText, null, qCounter) : null

        if (qHeader) {
          flushCurrentQ()
          qCounter++
          const headerInlineOpts = extractInlineOptionMatches(lineText, 'A')
          const qNum = qHeader.number || String(qCounter)
          let qText = qHeader.text
          if (headerInlineOpts.length >= 2) {
            const slicedHeader = extractQuestionHeader(lineText.slice(0, headerInlineOpts[0].index), null, qCounter - 1)
            if (slicedHeader) qText = slicedHeader.text
          }
          currentQ = {
            id: parseInt(qNum) || Date.now() + Math.random(),
            number: qNum,
            text: qText,
            options: { A: '', B: '', C: '', D: '', E: '', F: '', G: '' },
            correct: null,
            images: [...lineObj.images],
          }
          currentQOptAttrs = {}
          if (headerInlineOpts.length >= 2) {
            for (let idx = 0; idx < headerInlineOpts.length; idx++) {
              const curr = headerInlineOpts[idx]
              const endPos = idx + 1 < headerInlineOpts.length ? headerInlineOpts[idx + 1].index : lineText.length
              const subLineObj = sliceLineObj(lineObj, curr.index, endPos)
              let content = lineText.slice(curr.endOfPrefix, endPos).trim().replace(/^\*\*/, '').replace(/\*\*$/, '')
              content = content.replace(/\s*\((?:đúng|đáp án đúng|chính xác|correct|true)\)/i, '').replace(/\s*\[x\]/i, '').trim()
              currentQ.options[curr.letter] = content
              currentQOptAttrs[curr.letter] = checkOptionAttributes(subLineObj, curr.letter)
            }
          }
        } else if (multiMatches.length >= 2 && currentQ) {
          for (let idx = 0; idx < multiMatches.length; idx++) {
            const curr = multiMatches[idx]
            const endPos = idx + 1 < multiMatches.length ? multiMatches[idx + 1].index : lineText.length
            const subLineObj = sliceLineObj(lineObj, curr.index, endPos)
            let content = lineText.slice(curr.endOfPrefix, endPos).trim().replace(/^\*\*/, '').replace(/\*\*$/, '')
            content = content.replace(/\s*\((?:đúng|đáp án đúng|chính xác|correct|true)\)/i, '').replace(/\s*\[x\]/i, '').trim()
            currentQ.options[curr.letter] = content
            currentQOptAttrs[curr.letter] = checkOptionAttributes(subLineObj, curr.letter)
          }
          if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images)
        } else if (optMatch && currentQ) {
          const label = optMatch[1].toUpperCase()
          let content = optMatch[2].trim().replace(/^\*\*/, '').replace(/\*\*$/, '')
          content = content.replace(/\s*\((?:đúng|đáp án đúng|chính xác|correct|true)\)/i, '').replace(/\s*\[x\]/i, '').trim()
          currentQ.options[label] = content
          if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images)
          currentQOptAttrs[label] = checkOptionAttributes(lineObj, label)
        } else if (currentQ) {
          const lastKey = ['G', 'F', 'E', 'D', 'C', 'B', 'A'].find((k) => currentQ.options[k] !== '')
          if (lastKey) {
            if (lineText) currentQ.options[lastKey] += ' ' + lineText
            const lineAttrs = checkOptionAttributes(lineObj, lastKey)
            if (lineAttrs.isFullContentBold) {
              currentQOptAttrs[lastKey].isFullContentBold = true
              currentQOptAttrs[lastKey].hasAnyBoldContent = true
              currentQOptAttrs[lastKey].isBold = true
            }
            if (lineAttrs.hasHighlight) currentQOptAttrs[lastKey].hasHighlight = true
            if (lineAttrs.hasColor) {
              currentQOptAttrs[lastKey].hasColor = true
              currentQOptAttrs[lastKey].color = lineAttrs.color
            }
            if (lineAttrs.isUnderline) currentQOptAttrs[lastKey].isUnderline = true
          } else if (lineText) {
            currentQ.text += (currentQ.text ? '\n' : '') + lineText
          }
          if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images)
        }
      }

            flushCurrentQ()
      setParsedQuestions(questions)

      if (questions.length === 0) {
        alert("Không tìm thấy câu hỏi nào. Hãy kiểm tra lại định dạng đề hoặc bấm 'Xem Hướng Dẫn'!")
      } else {
        const withAns = questions.filter((q) => q.correct).length
        alert(`Đã nhận diện thành công ${questions.length} câu hỏi (${withAns} câu có đáp án đúng)!`)
      }
    } catch (err: any) {
      alert('Lỗi khi phân tích: ' + err.message)
    }
    setIsParsing(false)
  }

  const handleSaveToDatabase = async () => {
    if (parsedQuestions.length === 0) return
    setIsSaving(true)
    try {
      for (const q of parsedQuestions) {
        const groupName = `Câu ${q.number || Math.floor(Math.random() * 1000)}`
        const groupId = await createQuestionGroup(chapterId, groupName, true)
        let contentHtml = q.text
        if (q.images && q.images.length > 0) {
          contentHtml += `<br/>` + q.images.map((src: string) => `<img src="${src}" />`).join('<br/>')
        }
        await addQuestionVariant(
          groupId as string,
          {
            content: contentHtml,
            options: JSON.stringify(q.options),
            correctOption: q.correct || 'A',
            explanation: '',
          },
          chapterId,
          true
        )
      }
      alert('Lưu thành công vào ngân hàng!')
      onDone()
    } catch (e: any) {
      alert('Lỗi khi lưu: ' + e.message)
    }
    setIsSaving(false)
  }

  const handleUpdateQuestion = (idx: number, field: string, value: string) => {
    const updated = [...parsedQuestions]
    if (field.includes('option_')) {
      const optKey = field.split('_')[1]
      updated[idx].options[optKey] = value
    } else if (field === 'correct') {
      updated[idx].correct = value
    } else if (field === 'text') {
      updated[idx].text = value
    }
    setParsedQuestions(updated)
  }

  const handlePasteSampleQuizToEditor = () => {
    const sampleHtml = `<p><strong>[Câu 1]</strong> Thủ đô của Việt Nam là gì?</p>
<p><strong>A. Hà Nội</strong></p>
<p><strong>B.</strong> TP. Hồ Chí Minh</p>
<p><strong>C.</strong> Đà Nẵng</p>
<p><strong>D.</strong> Cần Thơ</p>
<p>&nbsp;</p>
<p>Câu 2: Phương trình nào sau đây có nghiệm x = 2?</p>
<p>A. 2x - 3 = 0</p>
<p><span style="color: #e02424;"><strong>B. x + 3 = 5</strong></span></p>
<p>C. x - 5 = 0</p>
<p>D. 3x = 9</p>`
    if (editorRef.current) editorRef.current.setContent(sampleHtml)
    setShowGuideModal(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">Nhập Đề Từ File Word (.docx)</h2>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={handleDocxFileSelect} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm flex items-center gap-2 border border-indigo-200 cursor-pointer transition"
            >
              <Upload size={15} />
              <span>Tải lên file Word (.docx)</span>
            </button>
            <button onClick={onDone} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={24} /></button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Tải trực tiếp file Word (.docx) hoặc dán nội dung đề thi vào khung dưới. Hệ thống tự động nhận diện đáp án in đậm (cả phương án, nội dung phương án hoặc chữ cái đầu), tô màu, highlight, gạch chân và bảng đáp án.
        </p>

        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <Editor
            onInit={(evt, editor) => (editorRef.current = editor)}
            apiKey="no-api-key"
            init={{
              height: 400,
              menubar: false,
              plugins: 'lists link image table code help wordcount',
              toolbar: 'undo redo | blocks | bold italic underline forecolor backcolor | alignleft aligncenter alignright | bullist numlist | removeformat | help',
              content_style: 'body { font-family:Inter,sans-serif; font-size:15px; padding:20px; line-height:1.6 } img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px; }',
              paste_data_images: true,
              automatic_uploads: true,
              images_upload_handler: (blobInfo: any) =>
                new Promise((resolve) => {
                  resolve('data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64())
                }),
            }}
          />
        </div>

        <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 hidden xs:inline">Nhận diện:</span>
              <div className="relative flex-1 min-w-[170px] max-w-full sm:max-w-xs md:max-w-sm">
                <select
                  value={importFormatMode}
                  onChange={(e) => setImportFormatMode(e.target.value)}
                  className="w-full appearance-none bg-white hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-semibold text-slate-800 outline-none shadow-xs transition cursor-pointer truncate"
                >
                  <option value="auto">⚡ Tự động nhận diện (Khuyên dùng)</option>
                  <option value="bold">🔤 In đậm: Cả phương án hoặc nội dung</option>
                  <option value="bold_letter">🔤 In đậm chữ cái đầu: A. B. C. D.</option>
                  <option value="color">🎨 Màu chữ / Highlight nền</option>
                  <option value="underline">✍️ Gạch chân đáp án đúng</option>
                  <option value="asterisk">⭐ Dấu sao: *A, *B, *C, *D</option>
                  <option value="key_table">📋 Bảng đáp án cuối đề</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200 text-slate-600 hover:text-indigo-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <BookOpen size={15} />
              <span>Đề mẫu</span>
            </button>

            <button
              onClick={parseQuiz}
              disabled={isParsing}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isParsing ? <RefreshCw className="animate-spin" size={15} /> : <FileText size={15} />}
              <span>{isParsing ? 'Đang phân tích...' : 'Phân tích đề thi'}</span>
            </button>
          </div>
        </div>
      </div>

      {parsedQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">Kiểm tra lại ({parsedQuestions.length} câu)</h3>
            <button onClick={handleSaveToDatabase} disabled={isSaving} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 cursor-pointer">
              {isSaving ? 'Đang Lưu...' : 'Lưu Vào Ngân Hàng'}
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {parsedQuestions.map((q, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-all">
                <div className="mb-4 pr-8 relative">
                  <button onClick={() => setParsedQuestions(parsedQuestions.filter((_, i) => i !== idx))} className="absolute top-0 right-0 text-slate-400 hover:text-rose-500 cursor-pointer"><Trash2 size={18} /></button>
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Câu {idx + 1}</label>
                  <textarea
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none bg-white"
                    rows={2}
                    value={q.text}
                    onChange={(e) => handleUpdateQuestion(idx, 'text', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((optKey) => {
                    if (optKey > 'D' && !q.options[optKey]) return null
                    const isCorrect = q.correct === optKey
                    return (
                      <div key={optKey} className={`flex items-center gap-2 p-2.5 rounded-xl border ${isCorrect ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, 'correct', optKey)}
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {isCorrect ? <Check size={14} /> : optKey}
                        </button>
                        <input
                          type="text"
                          value={q.options[optKey] || ''}
                          onChange={(e) => handleUpdateQuestion(idx, `option_${optKey}`, e.target.value)}
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowGuideModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Đề mẫu thử nghiệm nhận diện</h3>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hỗ trợ tự động nhận diện khi in đậm toàn bộ đáp án đúng (kể cả khi tất cả chữ cái A., B., C., D. đều in đậm), in đậm nội dung phương án, in đậm riêng chữ cái đầu, tô màu đỏ/xanh, tô nền vàng hoặc gạch chân.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handlePasteSampleQuizToEditor} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                <Copy size={14} />
                <span>Chèn đề mẫu vào khung soạn thảo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
