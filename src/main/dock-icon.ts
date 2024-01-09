import icon from '../../resources/icon.png?asset'
import icon10deg from '../../resources/icon-deg/icon-10deg.png?asset'
import icon20deg from '../../resources/icon-deg/icon-20deg.png?asset'
import icon30deg from '../../resources/icon-deg/icon-30deg.png?asset'
import icon40deg from '../../resources/icon-deg/icon-40deg.png?asset'
import icon50deg from '../../resources/icon-deg/icon-50deg.png?asset'
import icon60deg from '../../resources/icon-deg/icon-60deg.png?asset'
import icon70deg from '../../resources/icon-deg/icon-70deg.png?asset'
import icon80deg from '../../resources/icon-deg/icon-80deg.png?asset'
import icon90deg from '../../resources/icon-deg/icon-90deg.png?asset'
import icon100deg from '../../resources/icon-deg/icon-100deg.png?asset'
import icon110deg from '../../resources/icon-deg/icon-110deg.png?asset'

// 图标列表
const iconArray = [
  icon,
  icon10deg,
  icon20deg,
  icon30deg,
  icon40deg,
  icon50deg,
  icon60deg,
  icon70deg,
  icon80deg,
  icon90deg,
  icon100deg,
  icon110deg
]

export const getDockIconArray = () => {
  return iconArray
}

export const getDockIcon = (index: number) => {
  return iconArray[index]
}
