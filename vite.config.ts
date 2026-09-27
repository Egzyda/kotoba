import { defineConfig, type Plugin } from 'vite';

// ビルドごとに一意なバージョン文字列。
// アプリ内の「さいしんに する」ボタンが /version.json と比較して更新有無を判定する。
const APP_VERSION = new Date()
  .toISOString()
  .replace(/[-:T]/g, '')
  .slice(0, 12); // 例: 202609270430

function versionJson(): Plugin {
  return {
    name: 'kotoba-version-json',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: APP_VERSION }),
      });
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ version: APP_VERSION }));
      });
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [versionJson()],
});
