import chairUrl from '../../models/furniture/chair_standard.glb?url'
import tableUrl from '../../models/furniture/table_dining.glb?url'
import shelfUrl from '../../models/furniture/shelf_open.glb?url'
import monitorUrl from '../../models/electronics/monitor_desktop.glb?url'
import avatarUrl from '../../models/avatars/avatar_casual.glb?url'

export const avatarCasualUrl = avatarUrl

const furniture: Record<string, string> = {
  chair: chairUrl,
  table: tableUrl,
  shelf: shelfUrl,
  monitor: monitorUrl,
}

export function furnitureAssetFor(type: string): string | undefined {
  return Object.hasOwn(furniture, type) ? furniture[type] : undefined
}
