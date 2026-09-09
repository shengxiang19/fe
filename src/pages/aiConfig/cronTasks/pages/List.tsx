import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, message, Popconfirm, Space, Switch, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Trash2 } from 'lucide-react';
import { useRequest } from 'ahooks';
import { useHistory } from 'react-router-dom';
import moment from 'moment';

import PageLayout from '@/components/pageLayout';
import usePagination from '@/components/usePagination';
import EnhancedTable from '@/components/EnhancedTable';
import EllipsisText from '@/components/EllipsisText';
import { dateTimeFormat } from '@/utils/datetime/formatter';

import { NS } from '../constants';
import { getList, deleteItem, enableItem, disableItem, runItem } from '../services';
import type { AICronTask } from '../types';
import AddDrawer from './AddDrawer';
import EditDrawer from './EditDrawer';
import ExecutionHistoryDrawer from '../components/ExecutionHistoryDrawer';

const statusColorMap: Record<string, string> = {
  running: 'blue',
  success: 'green',
  failed: 'red',
};

export default function List() {
  const { t } = useTranslation(NS);
  const history = useHistory();
  const pagination = usePagination({ PAGESIZE_KEY: NS });
  const [addDrawerState, setAddDrawerState] = useState({ visible: false });
  const [editDrawerState, setEditDrawerState] = useState<{ visible: boolean; id?: number }>({ visible: false });
  const [historyDrawerState, setHistoryDrawerState] = useState<{ visible: boolean; task?: AICronTask }>({ visible: false });
  const [runningIds, setRunningIds] = useState<Record<number, boolean>>({});

  const { data, loading, run } = useRequest(getList, { refreshDeps: [] });

  // 有启用中或执行中的任务时，每 30s 自动刷新列表
  const hasActiveTask = useMemo(() => (data ?? []).some((item) => item.enabled === true || item.last_status === 'running'), [data]);
  useEffect(() => {
    if (!hasActiveTask) return;
    const timer = setInterval(() => run(), 30_000);
    return () => clearInterval(timer);
  }, [hasActiveTask, run]);

  const handleRun = (taskId: number) => {
    setRunningIds((prev) => ({ ...prev, [taskId]: true }));
    runItem(taskId)
      .then((res) => {
        run();
        if (res?.chat_id) {
          message.success(
            <span>
              {t('run_success')}
              <Button type='link' size='small' className='!px-1' onClick={() => history.push(`/nightingale-ai/chat/${encodeURIComponent(res.chat_id)}`)}>
                {t('view_result')}
              </Button>
            </span>,
          );
        } else {
          message.success(t('run_success'));
        }
      })
      .finally(() => {
        setRunningIds((prev) => ({ ...prev, [taskId]: false }));
      });
  };

  return (
    <>
      <PageLayout title={t('title')} doc='https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v9/usage/ai-config/cron-tasks/'>
        <div className='fc-page n9e'>
          <div className='flex flex-col gap-2'>
            <div className='fc-toolbar flex flex-wrap items-center justify-between gap-2'>
              <Alert message={t('help')} type='info' showIcon />
              <Space>
                <span>{t('total_tasks', { total: data?.length ?? 0 })}</span>
                <Button type='primary' icon={<PlusOutlined />} onClick={() => setAddDrawerState({ visible: true })}>
                  {t('add_btn')}
                </Button>
              </Space>
            </div>
            <div className='min-h-0 flex-shrink-0'>
              <EnhancedTable
                size='small'
                rowKey='id'
                pagination={pagination}
                loading={loading}
                dataSource={data}
                rowActions={(record) => {
                  if (!record.id) return null;
                  const taskId = record.id;
                  return {
                    inline: [
                      {
                        key: 'run',
                        icon: 'run',
                        text: t('run_now'),
                        loading: runningIds[taskId],
                        onClick: () => handleRun(taskId),
                      },
                      {
                        key: 'history',
                        icon: 'view',
                        text: t('history'),
                        onClick: () => setHistoryDrawerState({ visible: true, task: record }),
                      },
                      {
                        key: 'edit',
                        icon: 'edit',
                        text: t('common:btn.edit'),
                        onClick: () => setEditDrawerState({ visible: true, id: taskId }),
                      },
                      {
                        key: 'delete',
                        node: (
                          <Popconfirm
                            title={t('common:confirm.delete')}
                            onConfirm={() => {
                              deleteItem(taskId).then(() => {
                                message.success(t('common:success.delete'));
                                run();
                              });
                            }}
                          >
                            <Button
                              type='link'
                              className='fc-table-action-inline-btn is-danger'
                              icon={<Trash2 className='fc-table-action-menu-icon' />}
                              aria-label={t('common:btn.delete')}
                            />
                          </Popconfirm>
                        ),
                      },
                    ],
                  };
                }}
                actionColumn={{ title: t('common:table.operations'), width: 180 }}
                columns={[
                  {
                    dataIndex: 'name',
                    title: t('name'),
                    render: (val, record) => (
                      <div className='min-w-0'>
                        <div>{val}</div>
                        {record.description && <EllipsisText className='text-hint text-base' text={record.description} />}
                      </div>
                    ),
                  },
                  {
                    dataIndex: 'cron_expr',
                    title: t('cron_expr'),
                    width: 130,
                  },
                  {
                    dataIndex: 'llm_config_name',
                    title: t('llm_config'),
                    width: 160,
                    render: (val) => val || t('form.default_llm'),
                  },
                  {
                    dataIndex: 'last_run_at',
                    title: t('last_run_at'),
                    width: 230,
                    render: (val, record) => {
                      if (!val) return '-';
                      return (
                        <Space>
                          <span>{dateTimeFormat(moment.unix(val))}</span>
                          {record.last_status && <Tag color={statusColorMap[record.last_status]}>{t(`status.${record.last_status}`)}</Tag>}
                        </Space>
                      );
                    },
                  },
                  {
                    dataIndex: 'enabled',
                    title: t('enabled'),
                    width: 80,
                    render: (val, record) => (
                      <Switch
                        size='small'
                        checked={val}
                        onChange={(checked) => {
                          if (!record.id) return;
                          (checked ? enableItem(record.id) : disableItem(record.id)).then(() => {
                            message.success(t('common:success.modify'));
                            run();
                          });
                        }}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </PageLayout>
      <AddDrawer
        visible={addDrawerState.visible}
        onOk={() => {
          setAddDrawerState({ visible: false });
          run();
        }}
        onClose={() => setAddDrawerState({ visible: false })}
      />
      <EditDrawer
        id={editDrawerState.id}
        visible={editDrawerState.visible}
        onOk={() => {
          setEditDrawerState({ visible: false });
          run();
        }}
        onClose={() => setEditDrawerState({ visible: false })}
      />
      <ExecutionHistoryDrawer task={historyDrawerState.task} visible={historyDrawerState.visible} onClose={() => setHistoryDrawerState({ visible: false })} />
    </>
  );
}
