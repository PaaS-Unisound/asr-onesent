import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  hash: true,
  publicPath: './',
  history: { type: 'memory' },
  routes: [
    {
      path: '/',
      component: '@/pages/layout/index',
      routes: [
        {
          path: '/asr-one-sentence',
          component: '@/pages/layout/asrOneSentence/Test',
          title: '一句话识别_语音识别-云知声AI开放平台',
        },

        {
          path: '/',
          redirect: 'asr-one-sentence',
        },
      ],
    },
  ],

  theme: {
    'primary-color': '#1564FF',
    'border-radius-base': '4px',
  },
});
