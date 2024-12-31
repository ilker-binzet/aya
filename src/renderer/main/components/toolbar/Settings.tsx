import LunaToolbar from 'luna-toolbar/react'
import LunaModal from 'luna-modal/react'
import LunaSetting, {
  LunaSettingButton,
  LunaSettingSelect,
  LunaSettingTitle,
} from 'luna-setting/react'
import { t, notify } from '../../../lib/util'
import ToolbarIcon from '../../../components/ToolbarIcon'
import Style from './Settings.module.scss'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { observer } from 'mobx-react-lite'
import contain from 'licia/contain'
import debounce from 'licia/debounce'
import SettingPath from '../../../components/SettingPath'
import store from '../../store'

export default function Settings() {
  const [settingsModalVisiable, setSettingsModalVisiable] = useState(false)

  return (
    <>
      <LunaToolbar>
        <ToolbarIcon
          icon="setting"
          title={t('settings')}
          onClick={() => setSettingsModalVisiable(true)}
        />
      </LunaToolbar>
      <SettingsModal
        visible={settingsModalVisiable}
        onClose={() => setSettingsModalVisiable(false)}
      />
    </>
  )
}

interface ISettingsModalProps {
  visible: boolean
  onClose: () => void
}

const notifyRequireReload = debounce(() => {
  notify(t('requireReload'), { icon: 'info' })
}, 1000)

const SettingsModal = observer(function SettingsModal(
  props: ISettingsModalProps
) {
  const onChange = (key, val) => {
    if (contain(['language'], key)) {
      notifyRequireReload()
    }
    store.settings.set(key, val)
  }

  return createPortal(
    <LunaModal
      title={t('settings')}
      visible={props.visible}
      onClose={props.onClose}
    >
      <LunaSetting className={Style.settings} onChange={onChange}>
        <LunaSettingTitle title={t('appearance')} />
        <LunaSettingSelect
          keyName="theme"
          value={store.settings.theme}
          title={t('theme')}
          options={{
            [t('sysPreference')]: 'system',
            [t('light')]: 'light',
            [t('dark')]: 'dark',
          }}
        />
        <LunaSettingSelect
          keyName="language"
          value={store.settings.language}
          title={t('language')}
          options={{
            [t('sysPreference')]: 'system',
            English: 'en-US',
            ['中文']: 'zh-CN',
            ['Türkçe']: 'tr-TR',
          }}
        />
        <LunaSettingTitle title="ADB" />
        <SettingPath
          title={t('adbPath')}
          value={store.settings.adbPath}
          onChange={(val) => {
            notifyRequireReload()
            store.settings.set('adbPath', val)
          }}
          options={{
            properties: ['openFile'],
          }}
        />
        <LunaSettingButton
          description={t('restartAya')}
          onClick={() => main.relaunch()}
        />
      </LunaSetting>
    </LunaModal>,
    document.body
  )
})
