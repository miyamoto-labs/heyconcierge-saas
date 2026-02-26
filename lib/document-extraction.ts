export interface ExtractedImage {
  buffer: Buffer
  mimeType: string
  contextText: string
  sourceFilename: string
}

export interface ExtractionResult {
  text: string
  images: ExtractedImage[]
}

const MAX_IMAGES = 10
const MIN_IMAGE_SIZE = 5000 // Skip images smaller than ~5KB (likely icons/logos)

export async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  // Use pdf-parse for text (reliable) and pdfjs-dist for images
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const pdfData = await pdfParse(buffer)
  const text = pdfData.text

  const images: ExtractedImage[] = []

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const data = new Uint8Array(buffer)
    const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      if (images.length >= MAX_IMAGES) break

      const page = await doc.getPage(pageNum)

      // Get page text for context
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((s: string) => s.trim())
        .join(' ')
        .substring(0, 500)

      // Extract images via operator list
      const ops = await page.getOperatorList()
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (images.length >= MAX_IMAGES) break

        const fnId = ops.fnArray[i]
        // paintJpegImageXObject = already JPEG encoded
        // paintImageXObject = raw pixel data
        if (fnId === pdfjsLib.OPS.paintJpegImageXObject) {
          const imgName = ops.argsArray[i][0]
          try {
            const imgObj: any = await new Promise((resolve, reject) => {
              (page as any).objs.get(imgName, (obj: any) => {
                if (obj) resolve(obj)
                else reject(new Error(`Image ${imgName} not found`))
              })
            })

            if (imgObj && imgObj.data && imgObj.data.length > MIN_IMAGE_SIZE) {
              images.push({
                buffer: Buffer.from(imgObj.data),
                mimeType: 'image/jpeg',
                contextText: pageText || `Page ${pageNum} of property document`,
                sourceFilename: `pdf_page${pageNum}_img${i}.jpg`,
              })
            }
          } catch (e) {
            console.error(`Failed to extract JPEG image from page ${pageNum}:`, e)
          }
        } else if (fnId === pdfjsLib.OPS.paintImageXObject) {
          const imgName = ops.argsArray[i][0]
          try {
            const imgObj: any = await new Promise((resolve, reject) => {
              (page as any).objs.get(imgName, (obj: any) => {
                if (obj) resolve(obj)
                else reject(new Error(`Image ${imgName} not found`))
              })
            })

            // Raw pixel data — convert RGBA to basic BMP/PNG
            // Only process if the image is large enough to be a photo
            if (imgObj && imgObj.width && imgObj.height && imgObj.data) {
              const pixelCount = imgObj.width * imgObj.height
              if (pixelCount > 2500) { // Skip images smaller than ~50x50
                const pngBuffer = rgbaToPng(imgObj.data, imgObj.width, imgObj.height)
                if (pngBuffer.length > MIN_IMAGE_SIZE) {
                  images.push({
                    buffer: pngBuffer,
                    mimeType: 'image/png',
                    contextText: pageText || `Page ${pageNum} of property document`,
                    sourceFilename: `pdf_page${pageNum}_img${i}.png`,
                  })
                }
              }
            }
          } catch (e) {
            console.error(`Failed to extract raw image from page ${pageNum}:`, e)
          }
        }
      }

      page.cleanup()
    }

    doc.cleanup()
    doc.destroy()
  } catch (e) {
    console.error('PDF image extraction failed (text extraction still succeeded):', e)
  }

  return { text, images }
}

export async function extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
  const mammoth = await import('mammoth')
  const images: ExtractedImage[] = []
  let imageIndex = 0

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image: any) => {
        if (images.length >= MAX_IMAGES) {
          return { src: `skip_${imageIndex++}` }
        }
        const imgBuffer = await image.read()
        const contentType = image.contentType || 'image/png'

        if (imgBuffer.length > MIN_IMAGE_SIZE) {
          images.push({
            buffer: Buffer.from(imgBuffer),
            mimeType: contentType,
            contextText: '', // Filled in post-processing below
            sourceFilename: `docx_img_${imageIndex}.${contentType.split('/')[1] || 'png'}`,
          })
        }
        imageIndex++
        return { src: `placeholder_${imageIndex - 1}` }
      }),
    }
  )

  // Extract plain text
  const text = result.value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

  // Post-process: extract context text around each image placeholder
  const htmlParts = result.value.split(/placeholder_\d+/)
  let imgIdx = 0
  for (let i = 0; i < htmlParts.length - 1 && imgIdx < images.length; i++) {
    const before = htmlParts[i].replace(/<[^>]*>/g, '').trim().slice(-300)
    const after = (htmlParts[i + 1] || '').replace(/<[^>]*>/g, '').trim().slice(0, 300)
    images[imgIdx].contextText = `${before} [IMAGE] ${after}`.trim()
    imgIdx++
  }

  // Fill any remaining images without context
  for (let i = imgIdx; i < images.length; i++) {
    images[i].contextText = 'Image from property document'
  }

  return { text, images }
}

/**
 * Convert raw RGBA pixel data to a minimal PNG buffer.
 * This is a simple uncompressed PNG encoder to avoid needing sharp/canvas.
 */
function rgbaToPng(data: Uint8ClampedArray | Uint8Array, width: number, height: number): Buffer {
  // Create an uncompressed PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // IDAT: raw image data with filter byte per row
  const rawRows: Buffer[] = []
  for (let y = 0; y < height; y++) {
    const filterByte = Buffer.from([0]) // None filter
    const rowStart = y * width * 4
    const rowData = Buffer.from(data.slice(rowStart, rowStart + width * 4))
    rawRows.push(Buffer.concat([filterByte, rowData]))
  }
  const rawData = Buffer.concat(rawRows)

  // Use zlib deflate for IDAT
  const zlib = require('zlib')
  const compressed = zlib.deflateSync(rawData)

  // Build chunks
  const chunks: Buffer[] = [signature]
  chunks.push(makeChunk('IHDR', ihdr))
  chunks.push(makeChunk('IDAT', compressed))
  chunks.push(makeChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat(chunks)
}

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])

  // CRC32
  let crc = 0xffffffff
  for (let i = 0; i < crcData.length; i++) {
    crc ^= crcData[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  crc ^= 0xffffffff
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}
