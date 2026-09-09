import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Drawer, Table, Tag } from 'antd';
import { useRequest } from 'ahooks';
import { useHistory } from 'react-router-dom';
import moment from 'moment';

import EllipsisText from '@/components/EllipsisText';
import { dateTimeFormat } from '@/utils/datetime/formatter';

import { NS } from '../constants';
import { getLogs } from '../services';
import type { AICronTask } from '../types';

const statusColorMap: Record<string, string> = {
  running: 'blue',
  success: 'green',
  failed: 'red',
};

interface Props {
  task?: AICronTask;

  visible: boolean;
  onClose: () => void;
}

export default function ExecutionHistoryDrawer(props: Props) {
  const { t } = useTranslation(NS);
  const history = useHistory();
  const { visible, onClose, task } = props;
  const [p, setP] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, loading } = useRequest(
    () => {
      if (!visible || !task?.id) {
        return Promise.resolve(undefined);
      }
      return getLogs(task.id, { p, limit });
    },
    {
      refreshDeps: [visible, task?.id, p, limit],
    },
  );

  useEffect(() => {
    setP(1);
  }, [task?.id]);

  // 抽屉关闭时重置分页，避免同一任务重开后停留在上次页码/每页条数（AGENTS.md：关闭容器需重置本地状态）
  useEffect(() => {
    if (!visible) {
      setP(1);
      setLimit(10);
    }
  }, [visible]);

  return (
    <Drawer width={900} title={t('history')} placement='right' visible={visible} onClose={onClose} className='n9e-antd-drawer'>
      <Table
        size='small'
        rowKey='id'
        loading={loading}
        dataSource={data?.list}
        pagination={{
          current: p,
          pageSize: limit,
          total: data?.total ?? 0,
          showSizeChanger: true,
          onShowSizeChange: (_current, size) => {
            setP(1);
            setLimit(size);
          },
          onChange: (page, pageSize) => {
            setP(page);
            setLimit(pageSize);
          },
        }}
        columns={[
          {
            dataIndex: 'started_at',
            title: t('log_time'),
            width: 340,
            render: (val, record) => {
              if (!val) return '-';
              return record.ended_at ? `${dateTimeFormat(moment.unix(val))} ~ ${dateTimeFormat(moment.unix(record.ended_at))}` : dateTimeFormat(moment.unix(val));
            },
          },
          {
            dataIndex: 'status',
            title: t('common:table.status'),
            width: 100,
            render: (val) => (val ? <Tag color={statusColorMap[val]}>{t(`status.${val}`)}</Tag> : '-'),
          },
          {
            dataIndex: 'error',
            title: t('common:table.error_msg'),
            ellipsis: { showTitle: false },
            render: (val) => (val ? <EllipsisText text={val} /> : '-'),
          },
          {
            dataIndex: 'chat_id',
            title: t('common:table.operations'),
            width: 120,
            render: (val, record) => {
              if (!val) return '-';
              // 会话已被用户删除：展示占位提示，避免点击后报 chat not found
              if (record.chat_deleted) return <span className='text-hint'>{t('chat_deleted')}</span>;
              return (
                <Button type='link' size='small' className='!px-0' onClick={() => history.push(`/nightingale-ai/chat/${encodeURIComponent(val)}`)}>
                  {t('view_result')}
                </Button>
              );
            },
          },
        ]}
      />
    </Drawer>
  );
}
