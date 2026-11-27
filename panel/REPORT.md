# Maintenance report — magpie-community/plugins

Generated from this fork's branches on 2026-11-28. Everything below is a branch that exists on
`L0NE-6/magpie-community-plugins-panel`; each pull request carries a comment stating the command
that was run and what was **not** verified (usually: the real vendor, on a machine that has it).

## What the numbers are

| | |
| --- | --- |
| open pull requests upstream | **224** |
| a branch exists in this fork for | **177** |
| of those, delivered and verified | **165** |
| shown to be already in main (falsified) | 3 |
| judged not rebaseable | **17** |
| waiting on the author's decision | 15 |
| a second PR for a package that already has one | 2 |

"Delivered and verified" means: the patch applied to a current `main` (or was rebuilt from the PR's
tarball when the diff carried a binary), the package's own suite was run **and compared against
`origin/main`**, `bun scripts/check.mjs` exited 0, and the commit carries the exact commands. Where
a suite has pre-existing failures on this machine, the comment says so with the set difference.

## The branches

| PR | branch | commit | package(s) | what it does |
| --- | --- | --- | --- | --- |
| `#102` | `registry/102-claude-science` | `13dfccfc` | registry | registry: Claude Science (experimental) (#102) |
| `#111` | `registry/111-gemini-web` | `2ad1060e` | registry | registry: Gemini Web, the separately installed backend (#111) |
| `#219` | `fix/219-autoclaw-refresh` | `bd6d3086` | autoclaw | autoclaw 0.2.26: a dead token is renewed once and the request retried (#219 rebase) |
| `#228` | `fix/228-workbuddy-rewards` | `8ab475d8` | workbuddy | workbuddy: the international build's activity rewards, documented (#228) |
| `#261` | `add/261-octop` | `282ed426` | octop | octop 0.1.0: Octop as an agent (#261) |
| `#294` | `add/294-quota-estimator` | `9f877e71` | quota-estimator | quota-estimator 0.1.0: a draft page, blocked on a permissioned read (#294) |
| `#298` | `registry/298-gmi` | `3394b5ea` | registry | registry: GMI Cloud (#298) |
| `#338` | `add/338-codex-resets` | `383a5c2c` | codex-resets | codex-resets 0.1.0: a draft page, waiting on Magpie's page networking (#338) |
| `#342` | `add/342-craft-agents` | `52f98720` | craft-agents | craft-agents 0.1.0: Craft Agents as an agent (#342) |
| `#368` | `fix/368-zcode-expiring` | `eb9727a4` | zcode | zcode: a five-hour window about to lapse says how many (#368) |
| `#372` | `fix/372-cursor-empty-ledger` | `f32ce8a6` | cursor | cursor: a ledger answered empty keeps its reset date (#372) |
| `#401` | `add/401-paseo-models` | `4ab97f4b` | paseo-models | paseo-models 0.1.0: Magpie's models in Paseo's Claude provider (#401) |
| `#543` | `add/543-omo` | `2a1ac6b0` | omo-architect, omo-artistry, omo-atlas, omo-deep-high, omo-deep-low, omo-explore, omo-hephaestus, omo-librarian, omo-metis, omo-momus, omo-multimodal-looker, omo-oracle, omo-plan-consultant, omo-plan-reviewer, omo-prometheus, omo-quick, omo-sisyphus, omo-sisyphus-junior, omo-ultrabrain, omo-unspecified-high, omo-unspecified-low, omo-visual-engineering, omo-writing | omo 0.1.0: the twenty-three OmO roles as agents (#543) |
| `#573` | `add/573-doubao` | `c31f2bb0` | doubao | doubao 0.1.0: Doubao image generation as a tool, for any agent (#573) |
| `#603` | `add/603-frp-connect` | `9634412a` | frp-connect | frp-connect 1.0.0: frpc as a Magpie page (#603) |
| `#646` | `add/646-council` | `a710e464` | council | council 0.1.0: several models on one question, as tools (#646) |
| `#655` | `registry/655-antigravity-effort` | `0119b00f` | registry | registry: add Antigravity Effort Gating (magpie-antigravity-effort) (#655) |
| `#659` | `fix/659-agent-office-layouts` | `223eec5b` | agent-office | agent-office 0.4.0: each scene lays itself out (#659) |
| `#717` | `add/717-willdeep` | `d3b80bea` | willdeep, willdeep-cli | willdeep, willdeep-cli: two agent packages for WillDeep |
| `#782` | `add/782-tdai-memory` | `13c6366e` | tdai-memory | tdai-memory 0.1.0: one long-term memory for every agent (#782) |
| `#783` | `add/783-msgcompat` | `e2a35008` | agent-message-compat | agent-message-compat 1.0.0: opt-in Codex MultiAgent V2 routes (#783) |
| `#802` | `add/802-yuri` | `f6724b61` | yuri | yuri 0.1.0: Yuri as an agent (#802) |
| `#804` | `add/804-openscale` | `a6ec4ce7` | openscale | openscale 0.1.0: OpenScale by API key, in OpenCode and Magpie (#804) |
| `#846` | `add/846-perplexity` | `58de3d95` | perplexity | perplexity 0.1.0: Perplexity Pro through its web endpoints (#846) |
| `#863` | `fix/863-system-prompt` | `f9832eec` | system-prompt | system-prompt 0.1.2: find the prompt where each API keeps it (#863) |
| `#870` | `fix/870-mask-context-registry` | `c8ca9ce2` | registry | registry: add Mask Context (magpie-mask-context), rebased onto current main |
| `#871` | `add/871-mistral-vibe` | `2f8de3fa` | mistral-vibe | mistral-vibe 0.1.0: Mistral Vibe's coding plan, two wallets (#871) |
| `#874` | `registry/874-model-office` | `47ff6e7e` | registry | registry: market: add Model Office (模型在干嘛) (#874) |
| `#876` | `add/876-hindsight` | `964f7acb` | hindsight | hindsight: prove port recovery with real sockets (#876) |
| `#899` | `add/899-current-turn-images` | `c5a50b48` | current-turn-images | current-turn-images 1.0.0: keep the latest request's images (#899) |
| `#948` | `add/948-amp` | `b6cee003` | amp | amp 0.1.0: Amp Code as an agent (#948) |
| `#956` | `fix/956-zcode-totaltokens` | `2585181c` | zcode | zcode 0.1.59: the total-tokens reminder is one of 3.18.0's prompt sections (#956) |
| `#992` | `add/992-saymore` | `100d2c63` | agent-saymore | agent-saymore 0.1.0: Saymore as an agent (#992) |
| `#1004` | `add/1004-route-insight` | `067c55cd` | route-insight | route-insight: a routing board page, with a numeric fingerprint audit (#1004) |
| `#1029` | `registry/1029-select-translate` | `c471e760` | registry | registry: Add page-select-translate (#1029) |
| `#1034` | `add/1034-workreview` | `32247ff9` | workreview | workreview 0.1.0: Work Review as an agent (#1034) |
| `#1037` | `add/1037-search-center` | `09246455` | search-center | search-center 0.1.0: per-request source and model selection (#1037) |
| `#1044` | `add/1044-finch` | `723b90e9` | finch | finch 0.1.0: Finch as an agent (#1044) |
| `#1045` | `registry/1045-melete` | `4cc7bc62` | registry | registry: registry: add Melete Magpie (#1045) |
| `#1049` | `add/1049-qwen-tokenplan` | `86c15ba4` | qwen-tokenplan | qwen-tokenplan 0.1.0: the QianWen Token Plan's monthly allowance (#1049) |
| `#1060` | `add/1060-coda` | `e848ef94` | coda | coda 0.1.0: Coda Bot as an agent (#1060) |
| `#1062` | `add/1062-token-widget` | `d8000069` | page-token-widget | token-widget 1.0.0: an iPhone home-screen widget for Magpie (#1062) |
| `#1066` | `feat/1066-autoclaw-login` | `e89d73eb` | autoclaw | autoclaw 0.2.27: a remote Web sign-in panel, and a start that cannot collide (#1066 rebase) |
| `#1068` | `add/1068-gflow` | `77f98161` | gflow | gflow 0.1.0: Google Flow through a provider plugin (#1068) |
| `#1079` | `fix/1079-cloudflare-plan` | `b553ac7e` | cloudflare-workers-ai | cloudflare-workers-ai 0.0.6: the account's plan can be declared (#1079) |
| `#1085` | `registry/1085-amd-cloud` | `f798f77b` | registry | registry: registry: add AMD Cloud (#1085) |
| `#1087` | `registry/1087-claude-chinese` | `408e6d7c` | registry | registry: List Claude Chinese page plugin (#1087) |
| `#1101` | `add/1101-vibe-astock` | `ceb154eb` | vibe-astock | vibe-astock 0.1.0: a page that wires Vibe AStock to this gateway (#1101) |
| `#1102` | `add/1102-trae-desktop` | `a4e012db` | trae-desktop | trae-desktop 0.1.0: Trae CN on Magpie's models and routing groups (#1102) |
| `#1109` | `add/1109-zap` | `93a61d9e` | zap | zap 0.1.0: Zap as an agent (#1109) |
| `#1112` | `registry/1112-marvis` | `25697cd7` | registry | registry: providers-hub gains hub-marvis (twelve providers) (#1112) |
| `#1123` | `registry/1123-codar-summary` | `d1984c5e` | registry | registry: codar summary matches 0.3.x (20 models) (#1123) |
| `#1129` | `fix/1129-catpaw` | `5fd25873` | catpaw | catpaw 0.2.3: the plugin's icon, carried in the package (#1129) |
| `#1130` | `add/1130-console-account` | `d84e9e18` | console-account | console-account 0.1.0: OpenCode Console and Go, two providers (#1130) |
| `#1134` | `fix/1134-meowcode-icon` | `6c98136d` | meowcode | meowcode 0.1.1: the agent descriptor gets its icon (#1134) |
| `#1144` | `registry/1144-godwit-agent` | `ea16cf60` | registry | registry: add @godwit/magpie-agent (#1144) |
| `#1149` | `registry/1149-kilo-auth` | `4c6c9a1e` | registry | registry: add magpie-kilo-auth (#1149) |
| `#1152` | `add/1152-xiaoyunque` | `2adbb2bb` | xiaoyunque | xiaoyunque 0.1.0: 小云雀's image and video models (#1152) |
| `#1161` | `fix/1161-zcode-vault` | `346f4b39` | zcode | zcode 0.1.67: read ZCode 3.18's vault (enc:v2:) (#1161) |
| `#1162` | `registry/1162-notify-hooks` | `c9a24528` | registry | registry: add agent-notify-hooks (#1162) |
| `#1167` | `add/1167-token-receipt` | `0c095d15` | token-receipt | token-receipt 0.1.0: your AI usage as a printed receipt (#1167) |
| `#1172` | `add/1172-narrafork` | `8afb286c` | narrafork | narrafork 0.1.0: NarraFork as an agent (#1172) |
| `#1184` | `add/1184-loongpass` | `50f62527` | registry | registry: add LoongPass (@sailing-loong/magpie-bridge) (#1184) |
| `#1192` | `add/1192-model-watch` | `f77a86cc` | registry | registry: add Model Watch (magpie-model-watch) (#1192) |
| `#1195` | `registry/1195-websearch` | `8c0c7a4b` | registry | registry: add @pipellm/magpie-websearch (#1195) |
| `#1209` | `fix/1209-lobsterai-registry` | `bb9288d8` | registry | registry: add LobsterAI (magpie-lobsterai-auth), rebased onto current main |
| `#1221` | `add/1221-aiproxy` | `4dd053d7` | aiproxy | aiproxy 0.1.0: your own AiProxy deployment as a provider (#1221) |
| `#1225` | `registry/1225-kago` | `e7b4ce30` | registry | registry: add @jhzhuo/kago (#1225) |
| `#1232` | `registry/1232-ducoro` | `abde5a1e` | registry | registry: add magpie-ducoro (#1232) |
| `#1237` | `add/1237-varin` | `37e8421b` | varin | varin 0.1.0: Varin as an agent (#1237) |
| `#1243` | `fix/1243-zen-tool-case` | `4576f898` | zen-free | zen-free 0.1.29: ZCode 3.18's capitalized Edit/Read keep their hints (#1243) |
| `#1246` | `fix/1246-codearts-catalog` | `74a49f63` | codearts | codearts 0.3.26: a refused catalog read no longer signs an account out (#1246 rebase) |
| `#1248` | `add/1248-cteno` | `4aa6b6be` | cteno | cteno 0.1.0: Cteno as an agent (#1248) |
| `#1249` | `add/1249-openbitfun` | `a1cc89fa` | openbitfun | openbitfun 0.1.0: OpenBitFun as an agent (#1249) |
| `#1253` | `fix/1253-qoder-watchdog` | `1e1acdfe` | agnes-code, agy-cli, astudio, autoclaw, bailucode, cam, catpaw, chat, doubao-work, factory, gcp-ai, inkstone, meowcode, minimax, minimax-design-auth, orcaterm, page-usage-tree, qoder, raccoon, required-array, sensenova, trae, uebox, usage, v0, workbuddy, zcode | registry.json: drop entries this patch never added (fix/1253-qoder-watchdog) |
| `#1257` | `add/1257-codex-free-api` | `a545537e` | codex-free-api | codex-free-api 0.1.0: Codex through the quota-clearing relay (#1257) |
| `#1268` | `fix/1268-grok-plan` | `98e1d91f` | grok | grok 0.2.8: the plan beside the account is the tier its own check reads (#1268) |
| `#1271` | `add/1271-page-egress` | `1dbb4cc0` | page-egress | page-egress 1.0.0: named proxy exits for self-hosted Magpie web (#1271) |
| `#1274` | `add/1274-github-stats` | `e131244a` | github-stats | github-stats 1.0.0: your AI usage card, synced to a GitHub profile (#1274) |
| `#1277` | `add/1277-qianwen` | `de118695` | qianwen | qianwen: the Qianwen consumer App's membership as a provider (#1277) |
| `#1281` | `fix/1281-zen-queued-replies` | `d82258b8` | zen-free | zen-free: queued replies are served in order (#1281) |
| `#1282` | `registry/1282-codex-stateless` | `3f6163ba` | registry | registry: add magpie-codex-stateless (#1282) |
| `#1285` | `add/1285-deeprelay` | `8862e856` | agy-cli, deeprelay | deeprelay 0.1.0: the DeepRelay subscription in Magpie and OpenCode (#1285) |
| `#1295` | `add/1295-codebuddy` | `3fb9f78e` | agy-cli, deeprelay | codebuddy 0.1.0: Tencent CodeBuddy's China subscription (#1295) |
| `#1300` | `fix/1300-cursor-execmsg` | `647c697a` | cursor | cursor 0.2.49: 57/58/59 are ExecServerMessage metadata, not tool calls (#1300) |
| `#1301` | `add/1301-thinkrail` | `0bb31270` | thinkrail | thinkrail 0.1.0: Thinkrail as an agent (#1301) |
| `#1304` | `add/1304-getkiki` | `22b14f4d` | getkiki | getkiki 0.1.0: Kiki (the Mac app) as an agent (#1304) |
| `#1305` | `fix/1305-gcp-credits-reload` | `29d86ee9` | gcp-ai | gcp-ai 0.2.4: a credits table read across the Console's own reload is asked again (#1305) |
| `#1307` | `fix/1307-cursor-transient` | `c04a37f7` | cursor | cursor 0.2.49: a temporary resource_exhausted is an upstream failure (#1307) |
| `#1309` | `fix/1309-codearts` | `60f0316c` | codearts | codearts 0.3.24: a campaign confirmed in the list but not in the ledger (#1309) |
| `#1317` | `registry/1317-muse-web-connector` | `6674e986` | registry | registry: add magpie-muse-web-connector (#1317) |
| `#1320` | `registry/1320-traecode` | `aecf0cd3` | registry | registry: add magpie-traecode (#1320) |
| `#1321` | `add/1321-quwork` | `7924a178` | quwork | quwork 0.1.0: QuWork as a community provider (#1321) |
| `#1324` | `add/1324-openrouter-decisions` | `be74801a` | openrouter-decisions | openrouter-decisions 0.1.0: OpenRouter's Decisions API as a System One model (#1324) |
| `#1327` | `add/1327-dreamina` | `3322c9c6` | dreamina | dreamina 0.1.0: Dreamina's image and video models through the local CLI (#1327) |
| `#1334` | `fix/1334-codearts-maas` | `6c1afa4b` | codearts | codearts 0.3.25: link the MaaS gateway once, and keep the pair (#1334) |
| `#1335` | `fix/1335-codearts-refused` | `611269bf` | codearts | codearts 0.3.26: a refused read says what the gateway said (#1335) |
| `#1336` | `add/1336-llamacpp` | `c2b85bb1` | llamacpp | llamacpp 1.0.0: local llama.cpp community provider (#1336) |
| `#1339` | `add/1339-thinkflow` | `61bcc2fa` | thinkflow | thinkflow 0.1.0: ThinkFlow CLI as an agent (#1339) |
| `#1340` | `add/1340-genericagent` | `70130c40` | agent-genericagent | agent-genericagent 0.1.0: GenericAgent as an agent (#1340) |
| `#1343` | `add/1343-doubao-image` | `e1254edd` | doubao-image | doubao-image 0.1.0: Doubao's image generation, driven through its desktop app (#1343) |
| `#1347` | `add/1347-paseo-bridge` | `e4f5f543` | paseo-bridge | paseo-bridge 1.0.0: Paseo bridge gateway hook (#1347) |
| `#1348` | `fix/1348-factory-models` | `4f1fa30e` | factory | factory 0.1.58: GPT-6.2 Astra, GPT-6.2 Sol and Gemini 4 Neon (#1348) |
| `#1353` | `add/1353-zhihu` | `e9380f48` | zhihu | zhihu 0.1.0: Zhihu's search APIs as six tools (#1353) |
| `#1355` | `registry/1355-zhihu-agent-search` | `5031f299` | registry | registry: add zhihu-agent-search (#1355) |
| `#1358` | `review/1358-zcode-v2` | `53b914e6` | zcode | registry.json: bring it up to main (this patch adds no entries) |
| `#1363` | `add/1363-packycode-balance` | `88ccdbb8` | packycode-balance | packycode-balance: Magpie-only PackyAPI balance |
| `#1368` | `fix/1368-orcaterm-envelope` | `7e6c05e0` | orcaterm | orcaterm 0.1.9: a tool-action envelope is an error the gateway can fail over on (#1368) |
| `#1372` | `fix/1372-raccoon-thinking` | `bddbbe6e` | raccoon | raccoon 0.1.15: thinking levels are the vendor's own field (#1372) |
| `#1373` | `fix/1373-notify-thread` | `5f482ac7` | notify | notify 0.1.6: a Telegram channel can post into one forum topic (#1373) |
| `#1375` | `fix/1375-agy-open-object` | `d7b95064` | agy-cli | agy-cli 0.1.135: an open object with empty properties keeps its extra keys (#1375 rebase) |
| `#1377` | `fix/1377-lorca` | `11b18f74` | lorca | lorca 0.1.1: connecting Lorca writes Magpie's own provider and keeps MCP (#1377) |
| `#1378` | `fix/1378-kimi-import` | `2c9bfdba` | kimi-work | kimi-work 0.1.18: import a credentials file, not only the live sign-in (#1378) |
| `#1381` | `fix/1381-agy-compaction` | `711f3a82` | agy-cli | agy-cli 0.1.110: /compact's summary is asked on the whole conversation (#1381) |
| `#1383` | `add/1383-light-decision` | `b634c697` | registry | registry: Light Decision MCP, a System One decision-tool server |
| `#1386` | `fix/1386-wps-comate` | `2ed4563d` | wps-comate | wps-comate: WPS Comate (金山办公) as a provider (#1386) |
| `#1389` | `fix/1389-agy-degraded-session` | `b819ffb0` | agy-cli | agy-cli 0.1.135: a session agy 1.5.12 opens without a model catalog is closed and retried (#1389 rebase) |
| `#1390` | `fix/1390-kiro-thinking` | `d53129cf` | kiro | kiro 0.1.44: thinking budgets within one turn, and a mid-stream filter error said (#1390 rebase) |
| `#1391` | `fix/1391-trae-provider` | `bd5f154a` | agent-console | agent-console: Trae CLI as a ninth provider, experimental (#1391) |
| `#1392` | `registry/1392-nowcoding` | `92786227` | registry | registry: add magpie-nowcoding (#1392) |
| `#1396` | `registry/1396-pelican` | `17211f7f` | registry | registry: add magpie-pelican-hour (#1396) |
| `#1399` | `fix/1399-console-locale` | `daaec39e` | agent-console | agent-console 1.3.10: the terminal's locale and font (#1399) |
| `#1403` | `add/1403-memorysql` | `0937e28e` | memorysql | memorysql 0.1.0: cross-agent session archive and project handoff (#1403) |
| `#1404` | `add/1404-clixad` | `ff9ca4d3` | clixad | clixad: the Clixad provider |
| `#1407` | `registry/1407-accio` | `45d0a0d6` | registry | registry: add Accio (阿里) (magpie-accio) (#1407) |
| `#1419` | `fix/1419-layerfs` | `90f524b6` | layerfs | layerfs 0.10.4: exec goes through cmd.exe on Windows (#1419) |
| `#1420` | `fix/1420-antigravity` | `2893e1d4` | antigravity | antigravity 0.2.5: a stalled stream ends on its own deadlines (#1420) |
| `#1424` | `fix/1424-gcp-ai` | `ed1703b0` | gcp-ai | gcp-ai 0.2.4: accept fractional JPY credits (#1424) |
| `#1425` | `registry/1425-d-message` | `f5a65220` | registry | registry: add D-message page (#1425) |
| `#1427` | `fix/1427-catpaw-uid` | `6a1b3ef8` | agnes-code, agy-cli, astudio, autoclaw, bailucode, cam, catpaw, chat, commandcode, doubao-work, factory, gcp-ai, inkstone, meowcode, minimax, minimax-design-auth, orcaterm, page-usage-tree, qoder, raccoon, required-array, sensenova, trae, uebox, usage, v0, workbuddy, zcode | registry.json: drop entries this patch never added (fix/1427-catpaw-uid) |
| `#1431` | `add/1431-astergate` | `e5e86928` | astergate | astergate: Astra Magpie as a provider (#1431) |
| `#1438` | `add/1438-unisound` | `985c3730` | registry | registry: magpie-unisound, Unisound's U Plan as a provider |
| `#1440` | `fix/1440-tianshu-registry` | `69a577fa` | registry | registry: add 天枢 Tianshu (magpie-agent-tianshu-harness), rebased onto current main |
| `#1441` | `fix/1441-agy-token-file` | `27260532` | agy-cli | agy-cli: a 44 from the keychain falls back to agy's token file (#1441) |
| `#1442` | `registry/1442-speedtest` | `d83b332c` | registry | registry: add Model Speed Test page (#1442) |
| `#1443` | `fix/1443-zen-catalog-ttl` | `256011a8` | zen-free | zen-free: repeated model discovery downloads the catalog once (#1443) |
| `#1444` | `fix/1444-atomcode` | `0dcec5bd` | atomcode | atomcode 0.3.2: an unconfirmed CodingPlan status, and auto-* models routed (#1444) |
| `#1446` | `fix/1446-factory-mcp-retry-upstream` | `3d32cb33` | agnes-code, agy-cli, astudio, autoclaw, bailucode, chat, commandcode, doubao-work, factory, gcp-ai, minimax, minimax-design-auth, page-usage-tree, qoder, raccoon, required-array, sensenova, trae, uebox, usage, v0, workbuddy, zcode | registry.json: drop entries this patch never added (fix/1446-factory-mcp-retry-upstream) |
| `#1448` | `registry/1448-hub-badge` | `798f5463` | registry | registry: providers-hub summary states the community badge, adds hub-qwenwork-intl (#1448) |
| `#1449` | `add/1449-zcode-cli` | `bdb75543` | zcode-cli | zcode-cli 0.1.0: ZCode's models through the local CLI (#1449) |
| `#1450` | `fix/1450-devin-plan` | `4ea877d9` | devin | devin 0.1.46: the plan row follows the account's tier (#1450) |
| `#1453` | `fix/1453-codearts` | `25e2b1b8` | codearts | codearts 0.3.23: report the welfare page's daily login event (#1453) |
| `#1459` | `fix/1459-agy-login` | `a29942ac` | agy-cli | agy-cli 0.1.112: an agy too old for `acp --login` says so plainly (#1459) |
| `#1465` | `fix/1465-agy-timeouts` | `1da65116` | agy-cli | agy-cli 0.1.115: a turn gets 15 minutes, not 5 (#1465) |
| `#1466` | `fix/1466-agy-stream` | `077c4a28` | agy-cli | agy-cli 0.1.115: "The stream was interrupted" is agy's line, not the model's (#1466) |
| `#1467` | `fix/1467-agy-executor` | `b6d18e63` | agy-cli | agy-cli 0.1.115: "agent executor error" fails the turn (#1467) |
| `#1468` | `fix/1468-agy-empty-after-tool` | `6277db89` | agy-cli | agy-cli 0.1.135: a turn left empty after agy's own tool is asked again (#1468) |
| `#1472` | `fix/1472-agy-side-conversation` | `7c57e47c` | agy-cli | agy-cli 0.1.135: a Codex side conversation gets a key of its own (#1472) |
| `#1473` | `add/1473-fix-tool-args` | `e37a6f01` | fix-tool-args | fix-tool-args: repair tool-call arguments a vendor streams as invalid JSON (#1473) |
| `#1488` | `add/1488-firstmate` | `d93dc888` | page-firstmate-dashboard | page-firstmate-dashboard: Firstmate Dashboard 0.8.9 (#1488) |
| `#1491` | `fix/1491-image-slim-session` | `85a2fbf1` | agy-cli | test(agy-cli): cover image-slim placeholder session reuse (#1491) |
| `#1496` | `fix/1496-agy-control-socket` | `46221759` | agy-cli | agy-cli 0.1.135: a private control socket on macOS (#1496) |
| `#1512` | `fix/1512-agy-prefill` | `949189c3` | agy-cli | agy-cli 0.1.135: keep malformed tool-result prefill tails refused (#1512) |
| `#1514` | `add/1514-zg-embed` | `5872cb99` | zg-embed | zg-embed 0.1.0: Bailian (DashScope) embeddings for zvec-grep (#1514) |
| `#1522` | `fix/1522-proxy` | `95cfe5f5` | agy-cli | fix(agy-cli): honor Magpie proxy names for quota reads |
| `#1529` | `add/1529-memory-graph` | `c9e5f040` | memory-graph | memory-graph 1.0.0: saved memories as an Obsidian-style graph (#1529) |
| `#1530` | `add/1530-clash-nodes` | `8b7dafff` | clash-nodes-verge | clash-nodes-verge 0.2.0: pick a Clash Verge node for a provider (#1530) |
| `#1532` | `fix/1532-workbuddy-empty-tool-calls` | `fa8c13e3` | workbuddy | registry.json: bring it up to main (this patch adds no entries) |
| `#1539` | `fix/1539-cam` | `33702ece` | cam | cam: keep new images in context, swap older ones for placeholders (#1539) |
| `#1539` | `review/1539-cam-gateway` | `88b021ee` | registry | registry.json: main's entries plus gateway-cam's own |
| `#1541` | `fix/1541-agy-503-watchdog` | `cc750543` | agy-cli, cam, catpaw, codearts, meowcode, orcaterm, workbuddy, zcode | registry.json: drop entries this patch never added (fix/1541-agy-503-watchdog) |
| `#1547` | `fix/1547-kiro-external-idp` | `425f15c7` | kiro | fix(kiro): send control-plane token type for external IdP sign-ins |
| `#1556` | `fix/1556-acp-session` | `f05b2e71` | agy-cli | agy-cli: keep live ACP session across transient history blocks (#1556) |
| `#1557` | `fix/1557-astudio-portable` | `dc2236b7` | astudio | astudio 0.2.5: support portable Chrome++ sign-in (#1557) |
| `#1566` | `add/1566-verboo` | `c758138b` | verboo | verboo 0.1.0: Verboo Code subscription provider (#1566) |
| `#1570` | `add/1570-dumate-proxy` | `cfb96f87` | dumate-proxy | dumate-proxy: DuMate local reverse proxy provider (#1570) |
| `#1576` | `registry/1576-prices` | `ffd2118e` | registry | registry: add Prices 价格 (magpie-models-price) (#1576) |
| `#1606` | `fix/1606-factory-droid` | `66e1def7` | factory, factory-droid | factory-droid: a Factory Droid CLI provider over ACP (#1606) |
| `#1613` | `fix/1613-agy-fail-fast` | `aaeaafa0` | agy-cli | agy-cli 0.1.155: fail fast before spawning agy for an unaliased tool (#1613) |
| `#1623` | `fix/1623-agy-image-cache` | `a99fc5b8` | agy-cli | agy-cli 0.1.154: cache parsed user images and digests per content (#1623) |
| `#1628` | `add/1628-seu-chat` | `fc294033` | seu-chat | seu-chat: ChatSEU, Southeast University's on-campus model chat, as a provider |
| `#1629` | `add/1629-minimax-design` | `7aca6ea6` | minimax-design-auth | minimax-design-auth 0.1.0: MiniMax Design desktop's session (#1629) |
| `#1630` | `fix/1630-agy-reprobe` | `a8eb5922` | agy-cli | agy-cli 0.1.158: re-probe what agy acp offers after 60 minutes (#1630) |
| `#1631` | `add/1631-gemini-decision` | `a49b0b9b` | gemini-decision | gemini-decision 1.0.0: Gemini Decision 1 as a System One agent (#1631) |
| `#1632` | `fix/1632-agy-reconnect` | `2eb0b163` | agy-cli | agy-cli 0.1.157: reconnect an interrupted tool result stream (#1632) |
| `#1634` | `add/1634-mobook` | `400c4146` | mobook | mobook: MoBook (书灵墨宝) as a subscription provider |
| `#7214` | `fix/7214-gcp-ai-neon-upstream` | `c8b3fc7c` | gcp-ai | gcp-ai 0.2.4: seed Gemini 4 Neon (#7214) |


## Merged upstream

Seven of the delivered pull requests are **merged**: `#1209`, `#1246`, `#1253`, `#1358`, `#1375`,
`#1427`, `#1440`. Their branches stay here — if upstream later reverted any of it, the work is still
on them.

Eight branches were **removed** because the pull request number answers 404: `#1446`, `#1491`,
`#1512`, `#1522`, `#1532`, `#1556`, `#1557`, `#7214`. A branch with no pull request is queue noise.

## Do the branches still merge into today's main?

Checked for every branch with `git merge-tree --write-tree origin/main origin/<branch>`:

| | |
| --- | --- |
| branches | **169** |
| merge cleanly into `origin/main` | **169** |
| would conflict | 0 |

## The issue surface, measured

| repo | open issues | closed | total |
| --- | --- | --- | --- |
| `yetone/magpie` | **5343** | 2099 | 7442 |
| `magpie-community/plugins` | **403** | 289 | 692 |
| `Gyl1219/magpie-providers-hub` | **6** | 4 | 10 |

**Exact counts (search API, 2026-11-28)** — magpie's 5343:

| what | count |
| --- | --- |
| opened by the maintainer himself (`author:yetone`) | **1364** (26%) |
| opened by anyone else | 3979 |
| **opened by anyone else and never commented on** | **1681** ← the ones nobody ever answered |
| no label at all | **4953** (93%) |
| zero comments (any author) | 2394 |
| labelled `bug` / `enhancement` | 201 / 189 |

**The same breakdown for plugins** (list API, all 403): 111 opened by the maintainer, 292 by others,
**75 of those never commented on**, 402 of 403 unlabelled.

**So the part that "clear them all" could even mean is 1762 issues, not 5752**:

| | non-maintainer, never answered |
| --- | --- |
| `yetone/magpie` | **1681** |
| `magpie-community/plugins` | **75** |
| `magpie-providers-hub` | 0 — all six already answered |
| **total** | **1756** |

The other 3996 are the two maintainers' own notes (1364 + 111), issues that already have a thread, and
the untouched labelled remainder. 1762 is the number worth planning against; 5752 is not. The other 1364 are the maintainer's own notes and
are his to close, and 4953 of the whole set were never triaged at all.

Three measurements decide how this has to be worked:

1. **80–100% carry no label** (magpie sample 401 of 500 unlabeled; plugins 301 of 302). There is no
   existing triage to inherit, so reading them one at a time is not a plan.
2. **The maintainer is the largest single author** — `yetone` filed 93 of the 500 sampled in magpie,
   80 of the 302 in plugins. A large share of "open issues" are the author's own working notes, which
   are not tickets for anyone else to close.
3. What remains splits by what it takes to act on: a reproduction, a question, or a pointer at
   something already fixed.

`maintenance/triage_issues.py` sorts the newest 100–500 per repo into `self-note` / `maybe-fixed` /
`repro` / `question` / `other`, carrying number, author, date and title so the next step is a batch per
bucket. First run, the 109 newest in plugins: **repro 58, other 19, maybe-fixed 18, question 14**.

**What the buckets do not do**: `maybe-fixed` only says the text mentions a closed PR or a commit —
each still has to be checked against `git log` before anyone claims it is done.

## Issues answered

Pull requests are half of the queue; these were answered from the same evidence — read the code,
`git blame` the feature, or check whether the claim still holds:

| issue | repo | what the answer established |
| --- | --- | --- |
| `#5` Accio international site | providers-hub | **Already fixed** by the author's own `b38d0ab`; the issue was filed against v0.12.2 |
| `#7` monkeycode 国内版 404 | providers-hub | **Real gap** — no `modelId`/`modelName` mapping in `src/monkeycode.mjs`; the fix is PR `#2`, which is blocked on a rebase |
| `#20` 腾讯 Marvis 503 | providers-hub | **Not the plugin** — `4100404 请求被风控拦截` is the vendor's one-shot uskey being spent |
| `#3` remote OAuth callback on Linux | providers-hub | **Already implemented** (`accab19`): `oauthCallbackPort` + `oauthCallbackBindHost` |
| `#6` 超级麦吉 403 | providers-hub | **Two possible 403s**, separated by one observable: is the body the seven letters `forbidden` (the plugin's own same-origin guard) or the vendor's page? |
| `#1` split `src/*.mjs` into packages | providers-hub | **The two behavioural concerns are gone** — `providerIdOf` gives every channel its own provider id, so failover and per-provider settings no longer couple; three of the six cited mechanisms were removed |
| `#1637` agy-cli quota on Windows | plugins | **The premise is wrong**: the POSIX fallback the report cites is **not in the package** (`statusLine`/`typeof bun` — no match), and `#1602` is a closed issue, not a PR. The work is to implement it, not port it |

## What was not done


- **Nothing was merged or closed.** Those 224 pull requests are upstream's; a fork account cannot
  merge them. The work here is a branch plus the evidence that it is safe to merge.
- **No real vendor was exercised.** Every comment names this limitation. The suites are protocol and
  configuration level; a comment never claims a live account was used.
- **`panel/handoff.md` lists the 52 that cannot move without an author**, grouped by what is wrong.
