# 学生団体ココカラ 公式サイト v3（OASIZ風リニューアル）｜デプロイ手順

このフォルダをそのまま公開すれば、サイトが表示されます。
外部依存は Google Fonts（Archivo / Zen Kaku Gothic New / Noto Sans JP）のCDNのみで、それ以外は自己完結しています。

## デザインについて
参考サイト「OASIZ」の世界観をベースに、ココカラのブランド色（オレンジ）を"唯一の差し色"として再構築しています。
- オフホワイトの紙面 × 極太モノクロのタイポグラフィ
- ヒーローの渦は Canvas によるジェネラティブ・アニメーション（オレンジ〜琥珀）。`prefers-reduced-motion` にも対応。
- 各セクションはスクロールでふわっと表示されます。

## フォルダ構成
```
ココカラHP/
├── index.html          … トップページ
├── events.html         … イベント（募集中）
├── events-past.html    … イベント（開催済）
├── sponsors.html       … 協賛企業一覧
├── style.css           … 共通スタイル
├── site.js             … 共通スクリプト（ヒーロー演出・リビール・メニュー）
└── assets/
    ├── logo.png
    ├── event_20260710_pizza.jpg
    └── event_20260724_takoyaki.jpg
```

## 公開方法（Cloudflare Pages・2026-11〜）
- GitHub `yossy0/kokokara-hp` の main に push すると、Cloudflare Pages が自動で公開する（https://kokokara-hp.pages.dev/）
- Pages の設定: ビルドコマンド `node pages_build.mjs`、出力先 `_site`。`pages_build.mjs` が公開してよいファイルだけを `_site/` に写す
- 公開しないファイルは `pages_build.mjs` の除外に足す（`.` で始まるもの・`*.md`・`*.ps1`・`*.bat`・動画・`tools/` などは除外済み）。1ファイル 25 MiB まで

## サイトを更新するとき
1. 変更を main に push する。1〜2分で同じ URL に反映される

## メモ
- 公式LINE（`https://line.me/R/ti/p/@113crihp`）と参加申込フォーム（Googleフォーム）は、
  すでに全ページに実URLを埋め込み済みです。差し替えが必要な場合は各HTML内のリンクを編集してください。
- URL は Cloudflare Pages の無料の `kokokara-hp.pages.dev`（独自ドメインなし。名前は後から変えられない）。
- 画像を追加する場合は `assets/` に置き、各HTMLの `<img src="assets/...">` を参照してください。

<!-- deploy test: 20260717-0114 -->
