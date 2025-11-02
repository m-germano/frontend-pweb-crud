import { useEffect, useMemo, useState } from 'react'

type Props = {
  iso2?: string | null
  countryName?: string
  alt?: string
  size?: number // largura px (16, 20, 24, 32, 40, 48, 64, 80, 96, 128)
}

function normalizeIso(iso?: string | null) {
  return (iso || '').trim().toLowerCase()
}

export default function FlagImage({ iso2, countryName, alt, size = 64 }: Props) {
  const [code, setCode] = useState<string | null>(normalizeIso(iso2))
  const [src, setSrc] = useState<string | null>(null)
  const [tried, setTried] = useState<number>(0)

  // 1) fontes possíveis (em ordem de preferência)
  const sources = useMemo(() => {
    if (!code) return []
    // FlagCDN (png tamanhos fixos de largura wXX)
    const w = [16, 20, 24, 32, 40, 48, 64, 80, 96, 128].includes(size) ? size : 64
    const list: string[] = [
      `https://flagcdn.com/w${w}/${code}.png`,
      `https://flagcdn.com/${code}.svg`,
      // fallback alternativo conhecido
      `https://flagsapi.com/${code.toUpperCase()}/flat/${Math.min(Math.max(size, 16), 128)}.png`,
    ]
    return list
  }, [code, size])

  // 2) define src inicial sempre que code mudar
  useEffect(() => {
    if (sources.length) {
      setSrc(sources[0])
      setTried(1)
    } else {
      setSrc(null)
      setTried(0)
    }
  }, [sources])

  // 3) se não temos code, mas temos countryName → tenta buscar via REST Countries
  useEffect(() => {
    if (code || !countryName) return
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`)
        if (!res.ok) return
        const data = await res.json()
        const cca2 = data?.[0]?.cca2
        if (!aborted && cca2) setCode(String(cca2).toLowerCase())
        // se vier flags direto, pode usar também:
        const flagsPng = data?.[0]?.flags?.png
        if (!aborted && flagsPng && !code) {
          setSrc(flagsPng)
          setTried(999) // trava rota de fallbacks
        }
      } catch {
        // ignora
      }
    })()
    return () => {
      aborted = true
    }
  }, [countryName, code])

  if (!src) return null

  const onError = () => {
    // tenta a próxima fonte
    if (tried < sources.length) {
      setSrc(sources[tried])
      setTried(tried + 1)
      return
    }
    // por fim, tenta REST Countries flags
    if (code && tried < 999) {
      setSrc(`https://restcountries.com/v3.1/alpha/${code}`)
      setTried(999)
      return
    }
    // desiste
    setSrc(null)
  }

  return (
    <img
      src={src}
      width={size}
      height={Math.round((size * 3) / 4)}
      onError={onError}
      alt={alt || (code ? `Flag ${code.toUpperCase()}` : 'Flag')}
      style={{ display: 'inline-block', borderRadius: 4, objectFit: 'cover' }}
      loading="lazy"
    />
  )
}
