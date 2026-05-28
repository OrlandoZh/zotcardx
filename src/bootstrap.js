var chromeHandle;

function install() {
	Zotero.debug("🤪zotcard@zotero.org installed.");
}

async function startup({ id, version, rootURI }) {
	Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-include.js', { id, version, rootURI });
	Zotero.ZotCard.Logger.log("loadSubScript zot-include.js");
	
	Zotero.ZotCard.Logger.log(rootURI);

	var aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup);
    var manifestURI = Services.io.newURI(rootURI + "manifest.json");
    chromeHandle = aomStartup.registerChrome(manifestURI, [
        ["content", "zotcard", rootURI + "chrome/content/"]
    ]);

	await Zotero.PreferencePanes.register({
		pluginID: id,
		label: 'ZotcardX',
		image: 'chrome://zotcard/content/images/zotcard.png',
		src: rootURI + 'chrome/content/preferences/preferences.xhtml',
		scripts: [rootURI + 'chrome/content/preferences/preferences.js'],
			helpURL: 'https://github.com/Oz/zotcardx',
		});

		Services.scriptloader.loadSubScript(rootURI + 'zotcard-consts.js');
	Zotero.ZotCard.Logger.log("loadSubScript zotcard-consts.js");
	Zotero.ZotCard.Consts.init({ id, version, rootURI });

    Services.scriptloader.loadSubScript(rootURI + 'zotcard-cards.js');
    Zotero.ZotCard.Logger.log("loadSubScript zotcard-cards.js");

    Services.scriptloader.loadSubScript(rootURI + 'zotcard-dialog.js');
    Zotero.ZotCard.Logger.log("loadSubScript zotcard-dialog.js");
	
	Services.scriptloader.loadSubScript(rootURI + 'zotcard.js');
	Zotero.ZotCard.Logger.log("loadSubScript zotcard.js");
	Zotero.ZotCard.init({ id, version, rootURI });
	Zotero.ZotCard.addToAllWindows();
	await Zotero.ZotCard.main();
	
}

function onMainWindowLoad({ window }) {
	Zotero.ZotCard.initWindow(window);
}

function onMainWindowUnload({ window }) {
	Zotero.ZotCard.removeFromWindow(window);
}

function shutdown() {
	Zotero.ZotCard.Logger.log("Shutdown.");
	if (chromeHandle) {
		try {
			chromeHandle.destruct();
		} catch (e) {
			Zotero.logError("ZotcardX chromeHandle cleanup failed: " + e);
		}
		chromeHandle = null;
	}

	Zotero.ZotCard.removeFromAllWindows();
	Zotero.ZotCard.shutdown();
	Zotero.ZotCard = undefined;
}

function uninstall() {
	Zotero.debug("🤪zotcard@zotero.org Uninstalled.");
}
