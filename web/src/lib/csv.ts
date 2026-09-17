/**
 * Minimal RFC 4180 CSV parser.
 *
 * The committed data files are written by pandas with QUOTE_ALL, so every
 * field is quoted and embedded commas, newlines, and escaped quotes ("")
 * must round-trip exactly — a naive split(',') would corrupt the notes.
 */
export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1) // strip BOM

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  // Drop blank trailing lines (a lone empty field), keep genuinely empty fields.
  return rows.filter((r) => r.length > 1 || r[0] !== '')
}

/** Parse CSV text into objects keyed by the header row. */
export function parseCsvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const [header, ...data] = rows
  return data.map((row) => {
    const obj: Record<string, string> = {}
    header.forEach((name, i) => {
      obj[name] = row[i] ?? ''
    })
    return obj
  })
}
