if (!Zotero.ZotCard) Zotero.ZotCard = {};
if (!Zotero.ZotCard.L10ns) Zotero.ZotCard.L10ns = {};

Zotero.ZotCard.L10ns = Object.assign(Zotero.ZotCard.L10ns, {
  _l10n: typeof Localization !== 'undefined' ? new Localization(["zotcard.ftl"], true) : null,
  
	init() {
		Zotero.ZotCard.Logger.log('Zotero.ZotCard.L10ns inited.');
	},
  
  getString(name, params) {
    if (!this._l10n) {
      return name;
    }
    if (params) {
      return this._l10n.formatValueSync(name, params);
    }

    return this._l10n.formatValueSync(name);
  },
  
  getStringFtl(ftl, name, params) {
    let l10n = new Localization([ftl], true);
    if (params) {
      return l10n.formatValueSync(name, params);
    }

    return l10n.formatValueSync(name);
  }
});
