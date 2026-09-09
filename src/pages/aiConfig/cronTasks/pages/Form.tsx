import React from 'react';
import { Col, Form, Input, Row, Select, Switch } from 'antd';
import { FormInstance } from 'antd/es/form';
import { useTranslation } from 'react-i18next';
import { useRequest } from 'ahooks';

import { SIZE } from '@/utils/constant';
import { getList as getLLMConfigList } from '@/pages/aiConfig/llmConfigs/services';
import { getList as getSkillList } from '@/pages/aiConfig/skills/services';

import { NS } from '../constants';

interface Props {
  form: FormInstance;
}

export default function FormCpt(props: Props) {
  const { t } = useTranslation(NS);
  const { form } = props;
  const { data: llmConfigs = [] } = useRequest(getLLMConfigList);
  const { data: skills = [] } = useRequest(getSkillList);

  return (
    <Form form={form} layout='vertical'>
      <Row gutter={SIZE}>
        <Col flex='auto'>
          <Form.Item label={t('name')} name='name' rules={[{ required: true }]}>
            <Input placeholder={t('form.name_placeholder')} />
          </Form.Item>
        </Col>
        <Col flex='none'>
          <Form.Item label={t('enabled')} name='enabled' valuePropName='checked' initialValue={true}>
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label={t('form.content')} name='content' rules={[{ required: true }]}>
        <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} placeholder={t('form.content_placeholder')} />
      </Form.Item>
      <Row gutter={SIZE}>
        <Col span={12}>
          <Form.Item label={t('cron_expr')} name='cron_expr' rules={[{ required: true }]} extra={t('cron_expr_tip')}>
            <Input placeholder='0 */1 * * *' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={t('llm_config')} name='llm_config_id' initialValue={0}>
            <Select
              options={[
                { label: t('form.default_llm'), value: 0 },
                ...llmConfigs.map((item) => ({ label: item.model ? `${item.name} (${item.model})` : item.name, value: item.id })),
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label={t('form.skill', { ns: 'ai-config-agents' })} tooltip={t('form.skill_tip', { ns: 'ai-config-agents' })} name='skill_ids'>
        <Select
          placeholder={t('form.skill_placeholder', { ns: 'ai-config-agents' })}
          options={skills.map((skill) => ({ label: skill.name, value: skill.id }))}
          showSearch
          optionFilterProp='label'
          mode='multiple'
          allowClear
        />
      </Form.Item>
      <Form.Item label={t('description')} name='description'>
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder={t('form.description_placeholder')} />
      </Form.Item>
    </Form>
  );
}
