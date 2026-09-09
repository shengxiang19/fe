import React from 'react';
import { Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { CalendarClock, ChevronDown, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import moment from 'moment';

import { deleteChat, getTaskChats } from './services';
import { NAME_SPACE } from './constants';
import { IAiChatHistoryItem, IAiChatTaskGroup } from './types';
import { cn } from './utils';

interface ITaskChatsProps {
  selectedChatId?: string;
  refreshKey?: number;
  // 变化时重新拉取任务分组（如从配置页改完任务名返回侧边栏时同步文件夹名）
  navKey?: string;
  onSelect: (chat: IAiChatHistoryItem) => void;
  onDelete?: (chat: IAiChatHistoryItem) => void;
  onError?: (error: Error) => void;
}

// 定时任务的执行会话列表：相同任务的会话按文件夹样式组织。
// 用户没有任何任务执行会话时整体不渲染，不影响普通会话区块。
export default function TaskChats(props: ITaskChatsProps) {
  const { t } = useTranslation(NAME_SPACE);
  const { selectedChatId, refreshKey, navKey, onSelect, onDelete, onError } = props;
  const [groups, setGroups] = React.useState<IAiChatTaskGroup[]>([]);
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  const loadGroups = React.useCallback(async () => {
    try {
      const nextGroups = await getTaskChats();
      setGroups(nextGroups ?? []);
      // 首次加载自动展开最近有执行的第一个任务
      setExpanded((previous) => {
        if (Object.keys(previous).length || !nextGroups?.length) return previous;
        return { [nextGroups[0].task_id]: true };
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('load task chats failed'));
    }
  }, [onError]);

  React.useEffect(() => {
    loadGroups();
  }, [loadGroups, refreshKey, navKey]);

  const handleDeleteConfirm = React.useCallback(
    (chat: IAiChatHistoryItem) => {
      Modal.confirm({
        title: t('common:confirm.delete'),
        okText: t('common:btn.delete'),
        okButtonProps: { danger: true },
        cancelText: t('common:btn.cancel'),
        onOk: async () => {
          try {
            await deleteChat(chat.chat_id);
            setGroups((previous) =>
              previous.map((group) => ({ ...group, chats: group.chats.filter((item) => item.chat_id !== chat.chat_id) })).filter((group) => group.chats.length),
            );
            onDelete?.(chat);
          } catch (error) {
            onError?.(error instanceof Error ? error : new Error('delete task chat failed'));
          }
        },
      });
    },
    [onDelete, onError, t],
  );

  if (!groups.length) return null;

  return (
    <div className='pb-2'>
      <div className='flex items-center gap-1.5 px-2 pb-2 text-base font-semibold text-hint'>
        <CalendarClock size={13} />
        <span>{t('nightingale.tasks')}</span>
      </div>
      <div className='flex flex-col gap-0.5'>
        {groups.map((group) => {
          const isOpen = !!expanded[group.task_id];
          return (
            <div key={group.task_id}>
              <div
                className='group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-primary/10'
                onClick={() => setExpanded((previous) => ({ ...previous, [group.task_id]: !isOpen }))}
              >
                {isOpen ? <ChevronDown size={15} className='shrink-0 text-hint' /> : <ChevronRight size={15} className='shrink-0 text-hint' />}
                <CalendarClock size={15} className='shrink-0 text-hint group-hover:text-main' />
                <div className='min-w-0 flex-1 truncate font-normal text-title'>{group.task_name || t('nightingale.tasks')}</div>
                <span className='shrink-0 text-xs text-hint'>{group.chats.length}</span>
              </div>
              {isOpen &&
                group.chats.map((chat) => {
                  const isSelected = selectedChatId === chat.chat_id;
                  return (
                    <div
                      key={chat.chat_id}
                      className={cn(
                        'group flex cursor-pointer items-center gap-2 rounded-md py-1.5 pl-8 pr-2 transition-colors hover:bg-primary/10',
                        isSelected && 'bg-primary/10 text-primary',
                      )}
                      onClick={() => onSelect(chat)}
                    >
                      <MessageSquare size={14} className={cn('shrink-0 text-hint group-hover:text-main', isSelected && 'text-primary')} />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate font-normal text-title'>{chat.title || t('history.untitled')}</div>
                      </div>
                      <span className='shrink-0 text-xs text-hint'>{chat.last_update ? moment.unix(chat.last_update).format('MM-DD HH:mm') : ''}</span>
                      <Button
                        aria-label={t('common:btn.delete')}
                        className='hidden shrink-0 items-center justify-center text-hint hover:text-red-500 group-hover:flex'
                        icon={<Trash2 size={14} />}
                        size='small'
                        type='text'
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteConfirm(chat);
                        }}
                      />
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
