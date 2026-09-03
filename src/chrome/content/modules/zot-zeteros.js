if (!Zotero.ZotCard) Zotero.ZotCard = {};
if (!Zotero.ZotCard.Zoteros) Zotero.ZotCard.Zoteros = {};

Zotero.ZotCard.Zoteros = Object.assign(Zotero.ZotCard.Zoteros, {
	mainTabID: 'zotero-pane',

	init() {
		Zotero.ZotCard.Logger.log('Zotero.ZotCard.Zoteros inited.');
	},

	// Zotero 10 compatibility: singular selection getters throw, use plural equivalents.
	// Falls back to singular API for Zotero 7/8/9.
	getSelectedCollection() {
		let zp = Zotero.getMainWindow().ZoteroPane;
		if (zp.getSelectedCollections) return zp.getSelectedCollections()[0];
		return zp.getSelectedCollection();
	},

	getSelectedLibraryID() {
		let zp = Zotero.getMainWindow().ZoteroPane;
		if (zp.getSelectedLibraryIDs) return zp.getSelectedLibraryIDs()[0];
		return zp.getSelectedLibraryID();
	},

	getSelectedSavedSearch() {
		let zp = Zotero.getMainWindow().ZoteroPane;
		if (zp.getSelectedSavedSearches) return zp.getSelectedSavedSearches()[0];
		return zp.getSelectedSavedSearch();
	},

	getCollectionTreeRow() {
		let zp = Zotero.getMainWindow().ZoteroPane;
		if (zp.getCollectionTreeRows) return zp.getCollectionTreeRows()[0];
		return zp.getCollectionTreeRow();
	}
});