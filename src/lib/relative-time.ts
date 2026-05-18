/** Lightweight zh-TW relative time formatter. */
export function formatRelative(date: Date | string | number) {
  const d = date instanceof Date ? date : new Date(date)
  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 30) return "剛剛"
  if (sec < 60) return `${sec} 秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小時前`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} 天前`
  return d.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })
}
