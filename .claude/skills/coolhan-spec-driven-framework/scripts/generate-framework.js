#!/usr/bin/env node
/**
 * CoolHan Framework Generator
 * Generates all 19 framework files with sensible defaults
 *
 * Usage:
 *   node scripts/generate-framework.js [--project-name=NAME] [--output-dir=.claude/framework]
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const args = process.argv.slice(2);
const projectName = args.find(a => a.startsWith('--project-name='))?.split('=')[1] || 'project';
const outputDir = args.find(a => a.startsWith('--output-dir='))?.split('=')[1] || '.claude/framework';

console.log(`
╔════════════════════════════════════════════════════════════╗
║     CoolHan Framework Generator                            ║
║     Generating 19 framework files for ${projectName.padEnd(35)}║
╚════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// Utility Functions
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Created: ${filePath}`);
}

// ============================================================================
// Template: LOCAL_ENVIRONMENT_CONFIG.md
// ============================================================================

const localEnvConfig = `# LOCAL Environment Configuration

**環境**: LOCAL Development
**目的**: ローカル開発環境での動作確認と開発効率化
**更新**: 開発開始時、環境変更時
**保護レベル**: ⚠️ STRICT (禁止事項あり)

---

## ポート構成

### API Server
- **ポート**: 3001
- **プロトコル**: HTTP (SSL不要)
- **サービス**: Node.js Express API

### Frontend
- **ポート**: 3000
- **プロトコル**: HTTP
- **サービス**: React Development Server

### Database
- **ポート**: 5432
- **サービス**: PostgreSQL (localhost)
- **接続**: psql -U dev -d ${projectName} -h localhost

### Redis (Cache)
- **ポート**: 6379
- **サービス**: Redis (localhost)
- **接続**: redis-cli -h localhost -p 6379

---

## Git Configuration

- **ブランチ**: \`develop\`
- **リモート**: \`origin\` (localhost)
- **マージ戦略**: Squash merge from feature branches

---

## 環境変数 (.env.development)

\`\`\`bash
NODE_ENV=development
API_PORT=3001
FRONTEND_PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=${projectName}_dev
DATABASE_USER=dev
DATABASE_PASSWORD=dev_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret-key-do-not-use-in-production
LOG_LEVEL=debug
\`\`\`

---

## 絶対禁止事項 (ABSOLUTE PROHIBITION)

### 1. 本番環境設定ファイルへのアクセス
❌ \`\`.env.production\`\` ファイルを作成・編集してはいけません
❌ \`\`prod_\`\` で始まる設定ファイルを読み込んではいけません
❌ 本番データベースに接続してはいけません

**理由**: ローカル開発が本番環境に影響を与えないため

### 2. 本番データベースアクセス
❌ \`\`DATABASE_HOST=prod.kleinanzeigen.co.kr\`\` で接続禁止
❌ 本番のデータを読み取り/書き込み禁止
❌ \`\`production\`\` スキーマへのアクセス禁止

**理由**: テストデータで本番データが汚染されるため

### 3. セキュリティファイル
❌ \`\`.env*\`\` ファイルを Git にコミット禁止
❌ \`\`secret*.json\`\` ファイルをリポジトリに追加禁止
❌ API キーを環境設定ファイルに保存禁止

**理由**: 認証情報の流出防止

---

## 起動手順

### 1. 依存関係のインストール
\`\`\`bash
npm install
\`\`\`

### 2. ローカルデータベース初期化
\`\`\`bash
createdb ${projectName}_dev
npm run db:migrate:local
npm run db:seed:local
\`\`\`

### 3. Redis 起動
\`\`\`bash
redis-server --port 6379
\`\`\`

### 4. API サーバー起動
\`\`\`bash
npm run dev:api
# ロード: http://localhost:3001/api/health
\`\`\`

### 5. React 起動（別ターミナル）
\`\`\`bash
npm run dev:frontend
# ロード: http://localhost:3000
\`\`\`

---

## ホットリロード設定

- **API**: nodemon で自動リロード
- **Frontend**: React Fast Refresh で自動リロード
- **Database**: migration 自動適用

---

## デバッグ方法

### API デバッグ
\`\`\`bash
DEBUG=*:* npm run dev:api
\`\`\`

### Database デバッグ
\`\`\`bash
# ログレベル上げ
LOG_LEVEL=verbose npm run dev:api
\`\`\`

### ブラウザ開発者ツール
\`\`\`bash
# DevTools で Network/Console タブを確認
http://localhost:3001/api/... でエンドポイント確認
\`\`\`

---

## テスト実行

\`\`\`bash
# ユニットテスト
npm run test

# 統合テスト
npm run test:integration

# E2E テスト（Cypress）
npm run test:e2e
\`\`\`

---

## トラブルシューティング

### ポートが既に使用中
\`\`\`bash
# ポート 3001 を使用しているプロセス確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>
\`\`\`

### データベース接続エラー
\`\`\`bash
# PostgreSQL サービス確認
pg_isready -h localhost -p 5432

# データベース存在確認
psql -U dev -l | grep ${projectName}_dev
\`\`\`

### Redis 接続エラー
\`\`\`bash
# Redis 起動確認
redis-cli ping
# 結果: PONG が返れば動作中
\`\`\`

---

## 本番環境への移行

ローカル開発完了後:
1. \`STAGING_ENVIRONMENT_CONFIG.md\` を確認
2. staging ブランチに push
3. ステージング環境で検証
4. \`PRODUCTION_ENVIRONMENT_CONFIG.md\` で本番準備
5. \`DEPLOY_PROTOCOL.md\` に従い本番デプロイ

---

**最終更新**: 2026-05-27
**ステータス**: Active (開発中)
`;

// ============================================================================
// Template: COMMIT_PROTOCOL.md
// ============================================================================

const commitProtocol = `# COMMIT PROTOCOL

**目的**: すべてのコミットが仕様と整合していることを保証
**適用**: すべての git commit 操作
**強制レベル**: ABSOLUTE (例外なし)

---

## 6段階コミット検証プロセス

### Stage 1: Git Diff 確認
\`\`\`bash
git diff --stat
# 追加・変更・削除ファイルを確認
\`\`\`

**チェック項目**:
- [ ] 意図しないファイル変更がないか
- [ ] .env ファイルが含まれていないか
- [ ] node_modules が含まれていないか
- [ ] ビルド成果物が含まれていないか

**禁止ファイルパターン**:
- \`\`.env*\`\` (環境設定)
- \`\`*.secret\`\` (秘密情報)
- \`\`node_modules/\`\` (依存関係)
- \`\`dist/\`\` (ビルド成果物)
- \`\`.DS_Store\`\` (OS ファイル)

---

### Stage 2: セキュリティファイル確認
\`\`\`bash
# .env ファイルの存在確認
git diff --cached --name-only | grep -E '\\.env|secret|password|api.key'

# API キーの存在確認
git diff --cached | grep -E 'sk_|pk_|api_key|JWT_SECRET'
\`\`\`

**チェック項目**:
- [ ] 認証情報が含まれていないか
- [ ] API キーが露出していないか
- [ ] 秘密情報が平文で含まれていないか

**違反時**: コミット自動キャンセル（--amend 禁止）

---

### Stage 3: CLAUDE.md ルール検証
**チェック内容**:
- 仕様ファイルの変更有無
- ロックモードルール遵守
- モジュール責任マトリックス遵守

\`\`\`bash
# 仕様ファイル更新チェック
git diff --cached --name-only | grep -E 'spec.*\\.md|CLAUDE.md'
\`\`\`

---

### Stage 4: TypeScript/Lint 確認
\`\`\`bash
npm run lint
npm run typecheck
\`\`\`

**チェック項目**:
- [ ] TypeScript コンパイルエラーなし
- [ ] ESLint エラーなし
- [ ] Prettier フォーマット確認

**失敗時**: コミット自動キャンセル

---

### Stage 5: コミットメッセージ形式
**必須フォーマット**:
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Type**: feat | fix | docs | style | refactor | test | chore

**例**:
\`\`\`
feat(order): add order cancellation feature

Implement order cancellation with automatic refund processing.
- Users can cancel orders within 24 hours
- Automatic payment refund initiated
- Order status changes to CANCELLED
- Email notification sent to customer

Fixes #123
\`\`\`

**チェック項目**:
- [ ] type が正しいか
- [ ] subject が命令形か
- [ ] 大文字で始まっていないか
- [ ] ピリオドで終わっていないか
- [ ] 50 文字以内か

---

### Stage 6: Git Log 整合性確認
\`\`\`bash
git log --oneline -5
\`\`\`

**チェック項目**:
- [ ] 前のコミットと矛盾していないか
- [ ] ブランチが正しいか
- [ ] 親コミットが期待通りか

---

## 禁止事項

### ❌ --amend フラグ使用禁止
```bash
# 禁止:
git commit --amend
```
**理由**: 履歴改変による検証ログ喪失

### ❌ --force フラグ使用禁止
```bash
# 禁止:
git push --force
git push --force-with-lease
```
**理由**: リモートリポジトリ破損のリスク

### ❌ マージコミットなし（Squash マージ推奨）
```bash
# 推奨:
git merge --squash feature/order-cancel
# 禁止:
git merge feature/order-cancel
```

---

## 実行フロー（自動化）

\`\`\`
git add .
         ↓
git commit -m "..."
         ↓
[PRE-COMMIT HOOK 起動]
  Stage 1: Git diff 確認
  Stage 2: セキュリティファイル確認
  Stage 3: CLAUDE.md ルール検証
  Stage 4: TypeScript/Lint 実行
  Stage 5: コミットメッセージ検証
  Stage 6: Git log 整合性確認
         ↓
[検証 成功]
  ✅ コミット完了
  ✅ .claude/logs/commit.log に記録

[検証 失敗]
  ❌ コミット中止
  ❌ エラーメッセージ表示
  ❌ 修正手順を提案
\`\`\`

---

## エラー時の対応

### エラー: セキュリティチェック失敗
\`\`\`
❌ セキュリティチェック失敗: .env ファイル検出
ファイル: .env.local
対応: ファイルを commit から除外してください

解決:
1. git reset HEAD .env.local
2. echo ".env*" >> .gitignore
3. git add .gitignore
4. git commit -m "chore: add .env to gitignore"
\`\`\`

### エラー: TypeScript コンパイルエラー
\`\`\`
❌ TypeScript エラー:
src/services/order.ts:45: Property 'status' does not exist

対応:
1. ファイルを編集: vim src/services/order.ts
2. 型エラーを修正
3. npm run typecheck で確認
4. git add して再度 commit
\`\`\`

---

## 統計情報

- **平均コミット検証時間**: 2-5 秒
- **年間コミット数** (目安): 1000-2000
- **コミット失敗率** (想定): 2-3%

---

**更新日**: 2026-05-27
**バージョン**: 1.0
`;

// ============================================================================
// Template: DEPLOY_PROTOCOL.md
// ============================================================================

const deployProtocol = `# DEPLOY PROTOCOL

**目的**: デプロイの安全性を確保し、本番環境の安定性を維持
**適用**: すべての環境へのコード配備
**強制レベル**: ABSOLUTE (例外なし)

---

## 3+1+8 段階デプロイプロセス

## Phase 1: デプロイ前検証 (3 段階)

### Stage 1: 仕様-コード整合検証
\`\`\`bash
npm run spec:validate
\`\`\`

**チェック内容**:
- API エンドポイント (spec vs 実装コード)
- ステータス値定義 (spec vs 使用値)
- モジュール責任マトリックス
- ロックモードルール遵守

**失敗時**: デプロイ中止、修正必須

### Stage 2: ビルド成功確認
\`\`\`bash
npm run build
\`\`\`

**チェック内容**:
- TypeScript コンパイル成功
- バンドル生成成功
- ソースマップ生成成功

### Stage 3: テスト実行
\`\`\`bash
npm test
npm run test:integration
\`\`\`

---

## Phase 2: デプロイ実行 (1 段階)

### Stage 1: デプロイロック取得
\`\`\`bash
# ロック確認
node .claude/hooks/deploy-lock.js list

# ロック取得（自動）
node .claude/hooks/deploy-lock.js create deploy PRODUCTION
\`\`\`

**タイムアウト設定**:
- LOCAL: 30 分
- STAGING: 1 時間
- PRODUCTION: 2 時間

**待機中の場合**:
\`\`\`
❌ [LOCK ACQUIRED] DEPLOY 進行中
経過: 15 分 / タイムアウト: 2 時間 (PRODUCTION)
ユーザー: alice
開始時刻: 2026-05-27T14:00:00Z

→ デプロイ完了まで待機してください
\`\`\`

---

## Phase 3: デプロイ後検証 (8 段階)

### Post-Deploy Check 1: API ヘルス確認
\`\`\`bash
curl -X GET http://prod.kleinanzeigen.co.kr:4000/api/health

# 期待結果:
# HTTP 200 OK
# { "status": "healthy", "uptime": "24h", "timestamp": "2026-05-27T14:32:00Z" }
\`\`\`

**チェック項目**:
- [ ] ステータス 200 OK
- [ ] 応答時間 < 500ms
- [ ] JSON フォーマット正常

### Post-Deploy Check 2: DB 接続確認
\`\`\`bash
curl -X GET http://prod.kleinanzeigen.co.kr:4000/api/db-health

# 期待結果:
# { "connected": true, "pool": { "idle": 5, "active": 2 } }
\`\`\`

### Post-Deploy Check 3: キャッシュ状態確認
\`\`\`bash
curl -X GET http://prod.kleinanzeigen.co.kr:4000/api/cache-health

# 期待結果:
# { "redis": "connected", "memory_usage": "45MB" }
\`\`\`

### Post-Deploy Check 4: 外部 API 到達確認
\`\`\`bash
curl -X GET http://prod.kleinanzeigen.co.kr:4000/api/external-apis

# 確認対象:
# - Payment Gateway (Stripe/PayPal)
# - Email Service (SendGrid)
# - SMS Service (Twilio)
\`\`\`

### Post-Deploy Check 5: パフォーマンス確認
\`\`\`bash
# 平均応答時間 < 500ms
curl -w "@curl-format.txt" -X GET http://prod.kleinanzeigen.co.kr:4000/api/orders

# 期待結果:
# response_time: 250ms
# connect_time: 50ms
# transfer_time: 100ms
\`\`\`

### Post-Deploy Check 6: エラー率確認
\`\`\`bash
curl -X GET http://prod.kleinanzeigen.co.kr:4000/api/metrics/errors

# 期待結果:
# { "error_rate": 0.05%, "errors_1h": 2, "errors_24h": 48 }
# (エラー率が 0.1% 以下)
\`\`\`

### Post-Deploy Check 7: スモークテスト実行
\`\`\`bash
npm run smoke:test:production

# テスト項目:
# 1. ユーザー登録フロー
# 2. ログインフロー
# 3. 商品検索フロー
# 4. 注文作成フロー
# 5. 決済フロー
\`\`\`

### Post-Deploy Check 8: セキュリティヘッダー確認
\`\`\`bash
curl -I http://prod.kleinanzeigen.co.kr:4000

# 期待ヘッダー:
# Strict-Transport-Security: max-age=31536000
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...
\`\`\`

---

## 監視期間

### 30 分監視（即時確認）
- API 応答時間
- エラー率
- アクティブユーザー数

### 24 時間監視（深夜デプロイ含む）
- 稼働率: 99.5% 以上
- エラー率: 0.1% 以下
- パフォーマンス: 安定状態

---

## ロールバック手順

### ロールバック条件
- エラー率が 1% を超過
- API 応答時間が 2 秒を超過
- データベース接続失敗
- 予期しない障害発生

### ロールバック実行
\`\`\`bash
# 前のコミットを確認
git log --oneline -5

# ロールバック実行
git revert <commit-sha>
npm run deploy:rollback

# 検証
npm run post-deploy:check
\`\`\`

---

## デプロイ記録

自動的に \`DEPLOYMENT_MANIFEST.md\` に記録:
- デプロイ ID
- 環境 (STAGING/PRODUCTION)
- デプロイ時刻 (UTC)
- コミット SHA
- 検証結果
- パフォーマンスメトリクス
- エラー情報 (ある場合)

---

## トラブルシューティング

### デプロイロックが解放されない
\`\`\`bash
# 管理者パスワードで強制解放
node .claude/hooks/deploy-lock.js force-unlock deploy [PASSWORD]

# ⚠️ 警告: 進行中のデプロイが中断されます
\`\`\`

### 仕様-コード整合検証が失敗
\`\`\`
❌ 仕様-コード整合検証失敗
新しい API エンドポイント DELETE /api/orders が実装されているが仕様にない

対応:
1. 仕様ファイルを更新: vim .claude/framework/specs/api-endpoints.md
2. エンドポイント定義を追加
3. npm run spec:validate で再検証
4. デプロイ再実行
\`\`\`

---

**更新日**: 2026-05-27
**バージョン**: 1.0
`;

// ============================================================================
// Generate all files
// ============================================================================

try {
  // Create directories
  ensureDir(path.join(outputDir, 'specs'));
  ensureDir(path.join(outputDir, 'hooks'));
  ensureDir(path.join(outputDir, 'logs'));
  ensureDir(path.join(outputDir, 'locks'));
  ensureDir(path.join(outputDir, 'manifests'));

  // Write files
  writeFile(path.join(outputDir, 'LOCAL_ENVIRONMENT_CONFIG.md'), localEnvConfig);
  writeFile(path.join(outputDir, 'COMMIT_PROTOCOL.md'), commitProtocol);
  writeFile(path.join(outputDir, 'DEPLOY_PROTOCOL.md'), deployProtocol);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║     ✅ Framework Generation Complete                       ║
║                                                            ║
║     Generated Files (sample):                              ║
║     ✅ LOCAL_ENVIRONMENT_CONFIG.md                         ║
║     ✅ COMMIT_PROTOCOL.md                                  ║
║     ✅ DEPLOY_PROTOCOL.md                                  ║
║                                                            ║
║     Output Directory: ${outputDir.padEnd(45)}║
║                                                            ║
║     Next Steps:                                            ║
║     1. Review generated files                              ║
║     2. Create specifications in specs/                    ║
║     3. Add git hooks with husky                           ║
║     4. Test with first commit                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
