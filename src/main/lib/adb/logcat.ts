import Emitter from 'licia/Emitter'
import types from 'licia/types'
import { Client } from '@devicefarmer/adbkit'
import { getDeviceStore, getPidNames, setDeviceStore } from './base'
import uniqId from 'licia/uniqId'
import * as window from 'share/main/lib/window'
import { handleEvent } from 'share/main/lib/util'

let client: Client

class Logcat extends Emitter {
  private reader: any
  private paused = false
  constructor(reader: any) {
    super()

    this.reader = reader
  }
  async init(deviceId: string) {
    const { reader } = this

    reader.on('entry', async (entry) => {
      if (this.paused) {
        return
      }
      if (entry.pid != 0) {
        let pidNames = getDeviceStore(deviceId, 'pidNames')
        if (!pidNames || !pidNames[entry.pid]) {
          pidNames = await getPidNames(deviceId)
          setDeviceStore(deviceId, 'pidNames', pidNames)
        }
        entry.package = pidNames[entry.pid] || `pid-${entry.pid}`
      }
      this.emit('entry', entry)
    })
  }
  close() {
    this.reader.end()
  }
  pause() {
    this.paused = true
  }
  resume() {
    this.paused = false
  }
}

const logcats: types.PlainObj<Logcat> = {}

async function openLogcat(deviceId: string) {
  const device = await client.getDevice(deviceId)
  const reader = await device.openLogcat({
    clear: true,
  })
  const logcat = new Logcat(reader)
  await logcat.init(deviceId)
  const logcatId = uniqId('logcat')
  logcat.on('entry', (entry) => {
    window.sendTo('main', 'logcatEntry', logcatId, entry)
  })
  logcats[logcatId] = logcat

  return logcatId
}

async function pauseLogcat(logcatId: string) {
  logcats[logcatId].pause()
}

async function resumeLogcat(logcatId: string) {
  logcats[logcatId].resume()
}

async function closeLogcat(logcatId: string) {
  logcats[logcatId].close()
  delete logcats[logcatId]
}

export function init(c: Client) {
  client = c

  handleEvent('openLogcat', openLogcat)
  handleEvent('closeLogcat', closeLogcat)
  handleEvent('pauseLogcat', pauseLogcat)
  handleEvent('resumeLogcat', resumeLogcat)
}
