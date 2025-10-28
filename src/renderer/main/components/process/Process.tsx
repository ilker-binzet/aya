import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useState } from 'react'
import store from '../../store'
import LunaDataGrid from 'luna-data-grid/react'
import Style from './Process.module.scss'
import LunaToolbar, {
  LunaToolbarCheckbox,
  LunaToolbarInput,
  LunaToolbarSeparator,
  LunaToolbarSpace,
  LunaToolbarText,
} from 'luna-toolbar/react'
import ToolbarIcon from 'share/renderer/components/ToolbarIcon'
import fileSize from 'licia/fileSize'
import className from 'licia/className'
import has from 'licia/has'
import isEmpty from 'licia/isEmpty'
import { t } from '../../../../common/util'
import LunaModal from 'luna-modal'
import singleton from 'licia/singleton'
import map from 'licia/map'
import defaultIcon from '../../../assets/default-icon.png'
import toEl from 'licia/toEl'
import contain from 'licia/contain'
import find from 'licia/find'
import DataGrid from 'luna-data-grid'
import { useWindowResize } from 'share/renderer/lib/hooks'

export default observer(function Process() {
  const [processes, setProcesses] = useState<any[]>([])
  const packagesRef = useRef<string[]>([])
  const packageInfosRef = useRef<any[]>([])
  const dataGridRef = useRef<DataGrid>(null)
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('')

  const { device } = store

  const getPackageInfos = useCallback(
    singleton(async function () {
      if (!device) {
        return
      }
      packagesRef.current = await main.getPackages(device.id)
      packageInfosRef.current = await main.getPackageInfos(
        device.id,
        packagesRef.current
      )
    }),
    []
  )

  const getProcesses = useCallback(
    singleton(async function () {
      if (device) {
        if (isEmpty(packageInfosRef.current)) {
          getPackageInfos()
        }
        const allProcesses = await main.getProcesses(device.id)
        let processes = map(allProcesses, (process: any) => {
          const info = find(packageInfosRef.current, (info) => {
            const match = process.name.match(/^[\w.]+/)
            if (!match) {
              return false
            }

            return match[0] === info.packageName
          })

          if (info) {
            const icon = info.icon || defaultIcon
            const name = toEl(
              `<span><img src="${icon}" />${process.name.replace(
                info.packageName,
                info.label
              )}</span>`
            )
            return {
              ...process,
              packageName: info.packageName,
              label: info.label,
              name,
            }
          } else {
            return process
          }
        })
        if (!isEmpty(packagesRef.current) && store.process.onlyPackage) {
          processes = processes.filter((process) => {
            if (process.packageName) {
              return true
            }

            const match = process.name.match(/^[\w.]+/)
            if (match) {
              return contain(packagesRef.current, match[0])
            }

            return false
          })
        }
        setProcesses(processes)
      }
    }),
    []
  )

  useEffect(() => {
    let destroyed = false

    async function refresh() {
      if (store.panel === 'process') {
        await getProcesses()
      }
      if (!destroyed) {
        setTimeout(refresh, 5000)
      }
    }
    refresh()

    return () => {
      destroyed = true
    }
  }, [])

  useWindowResize(() => dataGridRef.current?.fit())

  async function stop() {
    if (!selected || !has(selected, 'packageName')) {
      return
    }
    const result = await LunaModal.confirm(
      t('stopPackageConfirm', { name: selected.label })
    )
    if (result) {
      await main.stopPackage(device!.id, selected.packageName)
      await getProcesses()
    }
  }

  return (
    <div className={className('panel-with-toolbar', Style.container)}>
      <LunaToolbar className="panel-toolbar">
        <LunaToolbarInput
          keyName="filter"
          value={filter}
          placeholder={t('filter')}
          onChange={(val) => setFilter(val)}
        />
        <LunaToolbarCheckbox
          keyName="onlyPackage"
          value={store.process.onlyPackage}
          label={t('onlyPackage')}
          onChange={(val) => {
            store.process.set('onlyPackage', val)
            getProcesses()
          }}
        />
        <LunaToolbarSeparator />
        <LunaToolbarText
          text={t('totalProcess', { total: processes.length })}
        />
        <LunaToolbarSpace />
        <ToolbarIcon
          disabled={selected === null || !has(selected, 'packageName')}
          icon="delete"
          title={t('stop')}
          onClick={stop}
        />
      </LunaToolbar>
      <LunaDataGrid
        onSelect={(node) => setSelected(node.data)}
        onDeselect={() => setSelected(null)}
        filter={filter}
        className={Style.processes}
        data={processes}
        columns={columns}
        selectable={true}
        uniqueId="pid"
        onCreate={(dataGrid) => {
          dataGridRef.current = dataGrid
          dataGrid.fit()
        }}
      />
    </div>
  )
})

const columns = [
  {
    id: 'name',
    title: t('processName'),
    sortable: true,
    weight: 30,
  },
  {
    id: '%cpu',
    title: '% CPU',
    sortable: true,
    weight: 10,
  },
  {
    id: 'time+',
    title: t('cpuTime'),
    sortable: true,
    weight: 10,
  },
  {
    id: 'res',
    title: t('memory'),
    sortable: true,
    comparator: (a: string, b: string) => fileSize(a) - fileSize(b),
    weight: 10,
  },
  {
    id: 'pid',
    title: 'PID',
    sortable: true,
    weight: 10,
  },
  {
    id: 'user',
    title: t('user'),
    sortable: true,
    weight: 10,
  },
]
