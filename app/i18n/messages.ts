import { fallbackLocale, isLocale, type Locale } from './config';
import zhCN from './messages/zh-CN.json';
import zhTW from './messages/zh-TW.json';
import enUS from './messages/en-US.json';
import jaJP from './messages/ja-JP.json';
import koKR from './messages/ko-KR.json';
import deDE from './messages/de-DE.json';
import frFR from './messages/fr-FR.json';
import esES from './messages/es-ES.json';
import ptBR from './messages/pt-BR.json';

export interface CardText {
  title: string;
  description: string;
}

export type Messages = Omit<typeof zhCN, 'content'> & {
  content: Record<string, CardText>;
};

export const dictionaries: Record<Locale, Messages> = {
  'zh-CN': zhCN, 'zh-TW': zhTW, 'en-US': enUS,
  'ja-JP': jaJP, 'ko-KR': koKR, 'de-DE': deDE,
  'fr-FR': frFR, 'es-ES': esES, 'pt-BR': ptBR,
};

export function getMessages(locale: string): Messages {
  return dictionaries[isLocale(locale) ? locale : fallbackLocale];
}
