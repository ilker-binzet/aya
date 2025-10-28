import { action, makeObservable, observable, runInAction, toJS } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'
import { IDevice } from '../../common/types'
import each from 'licia/each'
import filter from 'licia/filter'
import concat from 'licia/concat'
import unique from 'licia/unique'
import { isRemoteDevice } from './lib/util'
import dataUrl from 'licia/dataUrl'
import isStr from 'licia/isStr'
import find from 'licia/find'

class Store extends BaseStore {
  filter = ''
  ip = ''
  port = ''
  devices: IDevice[] = []
  remoteDevices: IDevice[] = []
  screenshotWeight = 40
  device: IDevice | null = null
  screenshot: string | null = null
  constructor() {
    super()
    makeObservable(this, {
      ip: observable,
      port: observable,
      devices: observable,
      device: observable,
      remoteDevices: observable,
      filter: observable,
      screenshotWeight: observable,
      screenshot: observable,
      setIp: action,
      setPort: action,
      setFilter: action,
      selectDevice: action,
      updateDevices: action,
      removeRemoteDevice: action,
      setScreenshotWeight: action,
    })

    this.init()
    this.bindEvent()
  }
  async init() {
    const remoteDevices: IDevice[] = await main.getDevicesStore('remoteDevices')
    const screenshotWeight: number = await main.getDevicesStore(
      'screenshotWeight'
    )
    runInAction(() => {
      if (remoteDevices) {
        this.remoteDevices = remoteDevices
      }
      if (screenshotWeight) {
        this.screenshotWeight = screenshotWeight
      }
    })

    const devices: IDevice[] = await main.getMemStore('devices')
    this.updateDevices(devices)
  }
  setIp(ip: string) {
    this.ip = ip
  }
  setPort(port: string) {
    this.port = port
  }
  setFilter(filter: string) {
    this.filter = filter
  }
  selectDevice(device: IDevice | string | null) {
    if (isStr(device)) {
      const devices: IDevice[] = concat(this.devices, this.remoteDevices)
      device = find(devices, (d) => d.id === device) || null
    }
    if (device && isRemoteDevice(device.id) && device.type === 'offline') {
      const [ip, port] = device.id.split(':')
      this.ip = ip
      this.port = port
    }
    this.device = device

    this.screenshot = null
    if (device && device.type !== 'offline') {
      main.screencap(device.id).then((data) => {
        const url = dataUrl.stringify(data, 'image/png')
        runInAction(() => {
          this.screenshot = url
        })
      })
    }
  }
  updateDevices(devices: IDevice[]) {
    let remoteDevices: IDevice[] = toJS(this.remoteDevices)
    each(remoteDevices, (device) => {
      device.type = 'offline'
    })
    remoteDevices = unique(remoteDevices, (a, b) => a.serialno === b.serialno)
    remoteDevices = unique(
      concat(
        remoteDevices,
        filter(devices, (device) => isRemoteDevice(device.id))
      ),
      (a, b) => a.id === b.id
    )
    this.devices = filter(devices, (device) => !isRemoteDevice(device.id))

    this.remoteDevices = remoteDevices
    main.setDevicesStore('remoteDevices', remoteDevices)

    if (this.device) {
      const id = this.device.id
      each(concat(remoteDevices, this.devices), (device) => {
        if (device.id === id) {
          this.selectDevice(device)
        }
      })
    }
  }
  removeRemoteDevice(id: string) {
    this.remoteDevices = filter(this.remoteDevices, (device) => {
      return device.id !== id
    })
    main.setDevicesStore('remoteDevices', toJS(this.remoteDevices))
  }
  setScreenshotWeight(weight: number) {
    this.screenshotWeight = weight
    main.setDevicesStore('screenshotWeight', weight)
  }
  private bindEvent() {
    main.on('changeMemStore', (name, val) => {
      switch (name) {
        case 'devices':
          this.updateDevices(val)
          break
      }
    })
  }
}

export default new Store()
