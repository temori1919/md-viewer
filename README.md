# MD Viewer (Edge)

ローカルの `.md` を GitHub 風テーマ + Mermaid で表示する個人用拡張。

1. `npm i && npm run build`
2. `edge://extensions` → 開発者モード ON → 「展開して読み込み」でこのフォルダを選択
3. 拡張の詳細で **「ファイルURLへのアクセスを許可する」** を ON
4. `file:///.../*.md` を開く (`samples/test.md` で確認)

ソース変更後は `npm run build` して拡張を再読み込み。

右上のボタンでライト/ダークを切り替えられます（選択は保存されます。未選択時は OS の設定に従います）。
