import { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { t, i18n } from '../common/util'
import getUrlParam from 'licia/getUrlParam'
import LunaModal from 'luna-modal'
import LunaFileList from 'luna-file-list'
import log from 'share/common/log'
import 'share/renderer/main'
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
import 'luna-file-list/css'
import 'luna-command-palette/css'
import 'luna-virtual-list/css'
import 'luna-dom-viewer/css'
import 'luna-otp-input/css'
import 'luna-split-pane/css'
import 'luna-path-bar/css'
import 'share/renderer/luna.scss'
import './luna.scss'
import 'share/renderer/main.scss'
import './main.scss'
import './icon.css'

const logger = log('renderer')
logger.info('start')

function renderApp() {
  logger.info('render app')

  const container: HTMLElement = document.getElementById('app') as HTMLElement

  let App = lazy(() => import('./main/App.js') as Promise<any>)
  let title = 'AYA'

  switch (getUrlParam('page')) {
    case 'terminal':
      App = lazy(() => import('share/renderer/terminal/App.js') as Promise<any>)
      title = t('terminal')
      break
    case 'process':
      App = lazy(() => import('share/renderer/process/App.js') as Promise<any>)
      title = t('processManager')
      break
    case 'screencast':
      App = lazy(() => import('./screencast/App.js') as Promise<any>)
      title = t('screencast')
      break
    case 'devices':
      App = lazy(() => import('./devices/App.js') as Promise<any>)
      title = t('deviceManager')
      break
    case 'avd':
      App = lazy(() => import('./avd/App.js') as Promise<any>)
      title = t('avdManager')
      break
    case 'about':
      App = lazy(() => import('share/renderer/about/App.js') as Promise<any>)
      title = t('aboutAya')
      break
  }

  preload.setTitle(title)

  createRoot(container).render(<App />)
}

;(async function () {
  const language = await main.getLanguage()
  i18n.locale(language)

  LunaModal.i18n.locale('en-US')
  LunaModal.i18n.set('en-US', {
    ok: t('ok'),
    cancel: t('cancel'),
  })
  LunaFileList.i18n.locale('en-US')
  LunaFileList.i18n.set('en-US', {
    name: t('name'),
    size: t('size'),
    type: t('type'),
    dateModified: t('dateModified'),
    directory: t('directory'),
    file: t('file'),
    permissions: t('permissions'),
  })

  renderApp()
})()
