import { createPortal } from 'react-dom'
import LunaModal from 'luna-modal/react'
import { t } from '../../../../common/util'
import { Row, Number } from '../../../components/setting'
import { useState } from 'react'
import store from '../../store'

interface IProps {
  visible: boolean
  initialScale: number
  onClose: () => void
}

export default function FontAdjustModal(props: IProps) {
  const [scale, setScale] = useState(props.initialScale)

  async function onChange(val: number) {
    if (!store.device) {
      return
    }
    setScale(val)
    await main.setFontScale(store.device.id, val)
  }

  return createPortal(
    <LunaModal
      title={t('fontAdjust')}
      width={400}
      visible={props.visible}
      onClose={props.onClose}
    >
      <Row className="modal-setting-row">
        <Number
          value={scale}
          title={t('scale')}
          min={0.5}
          max={4}
          step={0.1}
          range={true}
          onChange={onChange}
        />
      </Row>
    </LunaModal>,
    document.body
  )
}
