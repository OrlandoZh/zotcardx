#!/usr/bin/env node
// zotcardx 动态真机测试驱动
// 复用 AddonTemplate4Z zotero-domain runtime lib（prepareRuntime/installProxyAddon/RdpClient）
// 在隔离 managed runtime（独立 profile + dataDir，-no-remote）中拉起 Zotero 10，
// 通过 RDP chrome 求值执行只读与功能探针，输出结构化 PASS/FAIL 报告。
//
// 用法:
//   node dev/dynamic-test.mjs                # 全量探针 + 报告 + 退出
//   node dev/dynamic-test.mjs --smoke        # 仅 smoke 探针（host/addon/兼容 helper）
//   node dev/dynamic-test.mjs --keep-open    # 探针后保留 Zotero 进程（人工排查）

import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const FW_ROOT = "/Users/orlandozh/Documents/OH-WorkSpace/coding/projects/GitHub/AddonTemplate4Z";
const FW_LIB = path.join(FW_ROOT, "packs/zotero-domain/scripts/zotero-runner-lib.mjs");

const {
	prepareRuntime,
	installProxyAddon,
	buildStartupArgs,
	findFreePort,
	RdpClient,
	connectRdpWithLaunchDiagnostics,
	stopChildProcess,
} = await import(`file://${FW_LIB}`);

const BINARY = "/Applications/Zotero.app/Contents/MacOS/zotero";
const ADDON_ID = "zotcard@zotero.org";
const ADDON_VERSION = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "src", "manifest.json"), "utf-8")).version;
const ADDON_PATH = path.join(PROJECT_ROOT, "src"); // unpacked addon, manifest.json at root
const PROFILE_PATH = path.join(PROJECT_ROOT, ".zotero-runtime", "profile");
const DATA_DIR = path.join(PROJECT_ROOT, ".zotero-runtime", "data");
const REPORT_PATH = path.join(PROJECT_ROOT, "dev", "last-run.json");

const args = process.argv.slice(2);
const SMOKE_ONLY = args.includes("--smoke");
const KEEP_OPEN = args.includes("--keep-open");

const probes = [];

function probe(id, description, expression, options = {}) {
	probes.push({ id, description, expression, ...options });
}

// ---------- Phase 1: host / addon / 兼容 helper（只读） ----------

probe("host.version", "Zotero 主版本上报",
	`Zotero.version`, { expect: (v) => { if (!/^10\./.test(String(v))) throw new Error(`expect 10.x, got ${v}`); }, lane: "beta-preview" });

probe("addon.initialized", "ZotcardX bootstrap 初始化完成",
	`!!(Zotero.ZotCard && Zotero.ZotCard.initialized)`, { expect: (v) => { if (v !== true) throw new Error("Zotero.ZotCard not initialized"); } });

probe("addon.version", "插件版本与 manifest 一致",
	`(Zotero.ZotCard.Selfs && Zotero.ZotCard.Selfs.version) || null`,
	{ expect: (v) => { if (v !== ADDON_VERSION) throw new Error(`expect ${ADDON_VERSION}, got ${v}`); } });

probe("compat.collectionTreeRow", "getCollectionTreeRow 兼容 helper 不抛异常且返回 type",
	`(() => { try { const t = Zotero.ZotCard.Zoteros.getCollectionTreeRow()?.type; return { ok: true, type: t ?? null }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); if (typeof v.type !== "string") throw new Error(`type not string: ${JSON.stringify(v.type)}`); } });

probe("compat.pluralApiExists", "Zotero 10 plural selection API 存在（证明走的是新路径）",
	`(() => ({ c: typeof Zotero.getMainWindow().ZoteroPane.getSelectedCollections, l: typeof Zotero.getMainWindow().ZoteroPane.getSelectedLibraryIDs, s: typeof Zotero.getMainWindow().ZoteroPane.getSelectedSavedSearches, r: typeof Zotero.getMainWindow().ZoteroPane.getCollectionTreeRows }))()`,
	{ expect: (v) => { for (const k of ["c", "l", "s", "r"]) if (v[k] !== "function") throw new Error(`plural API ${k} missing`); } });

probe("compat.selectedCollectionNoThrow", "getSelectedCollection 兼容 helper 无异常",
	`(() => { try { const c = Zotero.ZotCard.Zoteros.getSelectedCollection(); return { ok: true, id: c?.id ?? null }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); } });

probe("compat.selectedLibraryIDNoThrow", "getSelectedLibraryID 兼容 helper 无异常",
	`(() => { try { const id = Zotero.ZotCard.Zoteros.getSelectedLibraryID(); return { ok: true, id: id ?? null }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); if (typeof v.id !== "number") throw new Error(`libraryID not number: ${JSON.stringify(v.id)}`); } });

probe("compat.selectedSavedSearchNoThrow", "getSelectedSavedSearch 兼容 helper 无异常",
	`(() => { try { const s = Zotero.ZotCard.Zoteros.getSelectedSavedSearch(); return { ok: true, id: s?.id ?? null }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); } });

// ---------- Phase 2: UI 元素 / l10n / 事件（只读） ----------

probe("ui.addedElementsPresent", "全部注册的 DOM 元素在主窗口存在（含 collection/item 菜单）",
	`(() => { const doc = Zotero.getMainWindow().document; const ids = Zotero.ZotCard.addedElementIDs || []; const missing = ids.filter(id => !doc.getElementById(id)); return { total: ids.length, missing, sample: ids.slice(0, 8) }; })()`,
	{ expect: (v) => { if (v.total === 0) throw new Error("no added elements recorded"); if (v.missing.length) throw new Error(`missing: ${v.missing.join(", ")}`); } });

probe("l10n.mainGetString", "主 FTL zh-CN 字符串解析非 key",
	`(() => { try { const v = Zotero.ZotCard.L10ns.getString('zotcard-unsupported_entries'); return { ok: true, value: v }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); if (v.value === "zotcard-unsupported_entries") throw new Error("FTL not resolved, got raw key"); } });

probe("l10n.prefPaneFtl", "偏好页 zotcard-prefpane.ftl 重命名后可解析",
	`(() => { try { const l10n = new Localization(["zotcard-prefpane.ftl"], true); const v = l10n.formatValueSync("zotero-zotcard-preferences-more"); return { ok: true, value: v }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); if (!v.value || v.value === "zotero-zotcard-preferences-more") throw new Error(`prefpane FTL unresolved: ${JSON.stringify(v.value)}`); } });

probe("events.notifierRegistered", "Notifier observer 已注册",
	`Zotero.ZotCard._notifierID !== 0`, { expect: (v) => { if (v !== true) throw new Error("notifierID still 0"); } });

probe("events.itemsViewOnSelect", "itemsView onSelect listener 已注册",
	`typeof Zotero.ZotCard.Events.itemsViewOnSelect`, { expect: (v) => { if (v !== "function") throw new Error(`itemsViewOnSelect = ${v}`); } });

probe("prefs.roundtrip", "Prefs 模块 set/get 往返",
	`(() => { try { Zotero.ZotCard.Prefs.set('dyn.test.key', 'v1'); const v = Zotero.ZotCard.Prefs.get('dyn.test.key'); Zotero.ZotCard.Prefs.clear('dyn.test.key'); return { ok: true, value: v }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error); if (v.value !== "v1") throw new Error(`roundtrip got ${JSON.stringify(v.value)}`); } });

// ---------- Phase 3: 功能链路（受控 mutation，一次性 dataDir 中执行） ----------

probe("func.createCardByCollection", "建 collection + concept 卡 + 保存 note + 清理",
	`(async () => {
		try {
			const libraryID = Zotero.Libraries.userLibraryID;
			const col = new Zotero.Collection();
			col.libraryID = libraryID;
			col.name = 'zotcardx-dynamic-test';
			const colID = await col.saveTx();
			const collection = Zotero.Collections.get(colID);
			const content = await Zotero.ZotCard.Cards.newCard(Zotero.getMainWindow(), collection, undefined, 'concept', undefined);
			if (!content || typeof content !== 'string' || content.length < 10) {
				return { ok: false, error: 'newCard returned empty content', colID };
			}
			const note = new Zotero.Item('note');
			note.libraryID = libraryID;
			note.addToCollection(colID);
			note.setNote(content);
			const itemID = await note.saveTx();
			const saved = Zotero.Items.get(itemID);
			const savedOk = !!saved && saved.isNote() && saved.getNote().length > 10 && saved.getCollections().includes(colID);
			await Zotero.Items.trashTx([itemID]);
			await col.eraseTx();
			return { ok: savedOk, contentLength: content.length, itemID };
		} catch (e) {
			return { ok: false, error: String(e) };
		}
	})()`,
	{ expect: (v) => { if (!v.ok) throw new Error(v.error || "card creation failed"); }, timeoutMs: 30000 });

probe("func.cardTemplatePref", "卡片模板 initPrefs fallback（fresh profile 应走内存默认模板）",
	`(() => { try { const pref = Zotero.ZotCard.Cards.initPrefs('concept'); return { ok: !!pref && !!pref.card, templateLength: pref?.card?.length ?? 0 }; } catch (e) { return { ok: false, error: String(e) }; } })()`,
	{ expect: (v) => { if (!v.ok) throw new Error(JSON.stringify(v)); if (v.templateLength < 10) throw new Error(`template too short: ${v.templateLength}`); } });

// ---------- 执行 ----------

async function main() {
	if (!fs.existsSync(BINARY)) throw new Error(`Zotero binary not found: ${BINARY}`);
	if (!fs.existsSync(path.join(ADDON_PATH, "manifest.json"))) throw new Error(`addon manifest missing in ${ADDON_PATH}`);

	// fresh 隔离 runtime（framework isManagedPath 依赖 .zotero-runtime 约定）
	await fsp.rm(path.join(PROJECT_ROOT, ".zotero-runtime"), { recursive: true, force: true });
	const runtimeSummary = await prepareRuntime({
		projectRoot: PROJECT_ROOT,
		profilePath: PROFILE_PATH,
		dataDir: DATA_DIR,
		fresh: true,
	});
	await installProxyAddon({ profilePath: PROFILE_PATH, addonId: ADDON_ID, addonPath: ADDON_PATH });

	const rdpPort = await findFreePort();
	const startupArgs = buildStartupArgs({ profilePath: PROFILE_PATH, dataDir: DATA_DIR, rdpPort });

	console.log(`[zotcardx-test] binary: ${BINARY}`);
	console.log(`[zotcardx-test] addon:  ${ADDON_PATH}`);
	console.log(`[zotcardx-test] rdp:    ${rdpPort}`);

	const processLogs = [];
	const child = spawn(BINARY, startupArgs, { cwd: PROJECT_ROOT, stdio: ["ignore", "pipe", "pipe"] });
	child.stdout.on("data", (d) => processLogs.push(String(d)));
	child.stderr.on("data", (d) => processLogs.push(String(d)));

	const results = [];
	let rdp = null;
	try {
		const connection = await connectRdpWithLaunchDiagnostics({ child, rdpPort, processLogs });
		rdp = connection.rdp;
		console.log(`[zotcardx-test] RDP connected in ${connection.connectDurationMs}ms`);

		const addon = await rdp.waitForAddonById(ADDON_ID, { timeoutMs: 30000 });
		console.log(`[zotcardx-test] addon loaded: ${addon.id} (active=${addon.isActive})`);
		results.push({ id: "addon.proxyLoaded", description: "proxy addon 已加载", pass: true, evidence: { isActive: addon.isActive } });

		// 等插件 bootstrap 完成
		const deadline = Date.now() + 30000;
		let initialized = false;
		while (Date.now() < deadline) {
			try {
				initialized = await rdp.evaluateInChrome(`!!(Zotero.ZotCard && Zotero.ZotCard.initialized)`, { timeoutMs: 5000, label: "plugin-init-poll" });
				if (initialized === true) break;
			} catch { /* poll again */ }
			await new Promise((r) => setTimeout(r, 500));
		}
		if (initialized !== true) throw new Error("Zotero.ZotCard.initialized never became true within 30s");

		for (const p of probes) {
			if (SMOKE_ONLY && !p.id.startsWith("host.") && !p.id.startsWith("addon.") && !p.id.startsWith("compat.")) continue;
			const started = Date.now();
			try {
				const value = await rdp.evaluateInChrome(p.expression, { timeoutMs: p.timeoutMs || 15000, label: p.id });
				await p.expect(value);
				results.push({ id: p.id, description: p.description, pass: true, value, ms: Date.now() - started });
				console.log(`  PASS  ${p.id} (${Date.now() - started}ms)`);
			} catch (e) {
				results.push({ id: p.id, description: p.description, pass: false, error: String(e?.message || e), ms: Date.now() - started });
				console.log(`  FAIL  ${p.id}: ${e?.message || e}`);
			}
		}
	} catch (e) {
		results.push({ id: "session.bringup", description: "runtime bring-up / RDP / bootstrap", pass: false, error: String(e?.message || e) });
		console.error(`[zotcardx-test] bring-up failed: ${e?.message || e}`);
	} finally {
		const summary = {
			runAt: new Date().toISOString(),
			lane: "zotero-10.0.2-beta.3-preview",
			binary: BINARY,
			addonId: ADDON_ID,
			addonPath: ADDON_PATH,
			rdpPort,
			runtimeSummary,
			passed: results.filter((r) => r.pass).length,
			failed: results.filter((r) => !r.pass).length,
			results,
			processLogTail: processLogs.slice(-12),
		};
		await fsp.mkdir(path.dirname(REPORT_PATH), { recursive: true });
		await fsp.writeFile(REPORT_PATH, JSON.stringify(summary, null, 2));
		console.log(`\n[zotcardx-test] ${summary.passed} passed, ${summary.failed} failed -> ${REPORT_PATH}`);

		if (rdp) rdp.disconnect();
		if (!KEEP_OPEN) {
			await stopChildProcess(child).catch(() => {});
		} else {
			console.log(`[zotcardx-test] keeping Zotero open (pid ${child.pid}); kill manually when done.`);
		}
		process.exit(summary.failed > 0 ? 1 : 0);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(2);
});
