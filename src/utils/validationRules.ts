import { required, url } from '@vee-validate/rules';
import { defineRule } from 'vee-validate';

// 定义规则
defineRule('required', required);
defineRule('url', url);

// 提示信息
export const messages = {
  titleRequired: '您需要输入网站名称',
  urlRequired: '请输入网站地址',
  urlInvalid: '请输入有效的网址',
};

// 规则导出
export const rules = {
  required,
  url,
};
