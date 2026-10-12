import { fallbackLocale, isLocale, type Locale } from './config';
import zhCN from './messages/zh-CN.json';
import zhTW from './messages/zh-TW.json';
import enUS from './messages/en-US.json';
import jaJP from './messages/ja-JP.json';

export interface CardText {
  title: string;
  description: string;
}

export type Messages = Omit<typeof zhCN, 'content'> & {
  content: Record<string, CardText>;
};

export const dictionaries: Record<Locale, Messages> = {
  'zh-CN': zhCN, 'zh-TW': zhTW, 'en-US': enUS, 'ja-JP': jaJP,
};

export function getMessages(locale: string): Messages {
  return dictionaries[isLocale(locale) ? locale : fallbackLocale];
}
