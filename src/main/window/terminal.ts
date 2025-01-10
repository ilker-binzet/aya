import { BrowserWindow, ipcMain } from 'electron'
import { getTerminalStore } from '../lib/store'
import * as window from '../lib/window'
import isBuffer from 'licia/isBuffer'

const store = getTerminalStore()

let win: BrowserWindow | null = null
let isIpcInit = false

export function showWin() {
  if (win) {
    win.focus()
    return
  }

  if (!isIpcInit) {
    isIpcInit = true
    initIpc()
  }

  win = window.create({
    name: 'terminal',
    minWidth: 960,
    minHeight: 640,
    ...store.get('bounds'),
    onSavePos: () => window.savePos(win, store),
  })

  win.on('close', () => {
    win?.destroy()
    win = null
  })

  window.loadPage(win, { page: 'terminal' })
}

const logs: string[] = []

export function init() {
  const stdoutWrite = process.stdout.write
  const stderrWrite = process.stderr.write

  process.stdout.write = function (...args) {
    addLog(args[0])

    return stdoutWrite.apply(process.stdout, args as any)
  }

  process.stderr.write = function (...args) {
    addLog(args[0])

    return stderrWrite.apply(process.stderr, args as any)
  }

  function addLog(data: string | Buffer) {
    if (isBuffer(data)) {
      data = data.toString('utf8')
    }
    logs.push(data as string)
    window.sendTo('terminal', 'addLog', data)
  }

  function logError(err: Error) {
    console.error(err)
  }

  process.on('uncaughtException', logError)
  process.on('unhandledRejection', logError)
}

function initIpc() {
  ipcMain.handle('getLogs', () => logs)
  ipcMain.handle('clearLogs', () => (logs.length = 0))
}
