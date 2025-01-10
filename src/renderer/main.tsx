import isMac from 'licia/isMac'
import { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { isDev, t, i18n } from '../common/util'
import hotKey from 'licia/hotkey'
import getUrlParam from 'licia/getUrlParam'
import './main.scss'
import './icon.css'
import 'luna-toolbar/css'
import 'luna-tab/css'
import 'luna-modal/css'
import 'luna-setting/css'
import 'luna-notification/css'
import 'luna-image-viewer/css'
import 'luna-logcat/css'
import 'luna-data-grid/css'
import 'luna-performance-monitor/css'
import 'luna-icon-list/css'
import './luna.scss'
import LunaModal from 'luna-modal'

function renderApp() {
  const container: HTMLElement = document.getElementById('app') as HTMLElement

  let App = lazy(() => import('./main/App.js') as Promise<any>)
  let title = 'AYA'

  switch (getUrlParam('page')) {
    case 'terminal':
      App = lazy(() => import('./terminal/App.js') as Promise<any>)
      title = t('terminal')
      break
  }

  preload.setTitle(title)

  createRoot(container).render(<App />)
}

if (isDev()) {
  hotKey.on('f5', () => location.reload())
}

;(async function () {
  const language = await main.getLanguage()
  i18n.locale(language)

  LunaModal.i18n.locale('en-US')
  LunaModal.i18n.set('en-US', {
    ok: t('ok'),
    cancel: t('cancel'),
  })

  document.body.classList.add(`platform-${isMac ? 'mac' : 'windows'}`)

  renderApp()
})()
