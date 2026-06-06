export function formatMoney(val: number): string {
  const prefix = val < 0 ? '-' : ''
  return prefix + '¥' + Math.abs(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${mins}`
}

export function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return `${Math.floor(diff)}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}