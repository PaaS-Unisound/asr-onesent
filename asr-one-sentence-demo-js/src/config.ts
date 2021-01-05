export enum AiCode {
  One = 'asr-one-sentence',
}

export const Config = {
  [AiCode.One]: {
    appKey: 'appKey',
    secret: 'secret',
    path: 'servicePath',
  },
};
