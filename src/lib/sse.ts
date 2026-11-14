export type ParsedSseEvent = {
  event: string
  data: unknown
}

function parseBlock(block: string): ParsedSseEvent | null {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of block.split('\n')) {
    if (line.startsWith(':')) {
      continue
    }
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  try {
    return { event, data: JSON.parse(dataLines.join('\n')) as unknown }
  } catch {
    return null
  }
}

export async function parseSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ParsedSseEvent) => void,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer = `${buffer}${decoder.decode(value, { stream: true })}`.replace(/\r\n/g, '\n')

      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const event = parseBlock(block)
        if (event !== null) {
          onEvent(event)
        }
        boundary = buffer.indexOf('\n\n')
      }
    }

    buffer += decoder.decode()
    if (buffer.trim() !== '') {
      const event = parseBlock(buffer)
      if (event !== null) {
        onEvent(event)
      }
    }
  } finally {
    reader.releaseLock()
  }
}
