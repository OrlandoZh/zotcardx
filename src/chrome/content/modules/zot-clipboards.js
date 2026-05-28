if (!Zotero.ZotCard) Zotero.ZotCard = {};
if (!Zotero.ZotCard.Clipboards) Zotero.ZotCard.Clipboards = {};

Zotero.ZotCard.Clipboards = Object.assign(Zotero.ZotCard.Clipboards, {
	init() {
		Zotero.ZotCard.Logger.log('Zotero.ZotCard.Clipboards inited.');
	},

  _copyWithTransferable(flavors) {
    if (typeof Components === 'undefined' || !Components.classes) {
      return false;
    }

    try {
      let transferable = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
      let clipboardService = Components.classes['@mozilla.org/widget/clipboard;1'].getService(Components.interfaces.nsIClipboard);

      flavors.forEach(({ flavor, value }) => {
        let str = Components.classes['@mozilla.org/supports-string;1'].createInstance(Components.interfaces.nsISupportsString);
        str.data = value;
        transferable.addDataFlavor(flavor);
        transferable.setTransferData(flavor, str, value.length * 2);
      });

      clipboardService.setData(transferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
      return true;
    } catch (e) {
      Zotero.ZotCard.Logger.log('copyWithTransferable failed: ' + e);
      return false;
    }
  },

  _copyWithClipboardItem(items, fallback) {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return fallback();
    }

    try {
      let clipboardItem = new ClipboardItem(Object.fromEntries(
        Object.entries(items).map(([type, value]) => [type, new Blob([value], { type })])
      ));
      navigator.clipboard.write([clipboardItem]).catch(e => {
        Zotero.ZotCard.Logger.log('navigator.clipboard.write failed: ' + e);
        fallback();
      });
      return true;
    } catch (e) {
      Zotero.ZotCard.Logger.log('copyWithClipboardItem failed: ' + e);
      return fallback();
    }
  },

  copyHtmlToClipboard(textHtml) {
    return this._copyWithClipboardItem(
      { 'text/html': textHtml },
      () => this._copyWithTransferable([{ flavor: 'text/html', value: textHtml }])
    );
  },

  copyHtmlTextToClipboard(textHtml, text) {
    text = text.replace(/\r\n/g, '\n');
    textHtml = textHtml.replace(/\r\n/g, '\n');

    return this._copyWithClipboardItem(
      { 'text/html': textHtml, 'text/plain': text },
      () => this._copyWithTransferable([
        { flavor: 'text/html', value: textHtml },
        { flavor: 'text/plain', value: text },
      ])
    );
  },

  copyTextToClipboard(text) {
    text = text.replace(/\r\n/g, '\n');
    let fallback = () => this._copyWithTransferable([{ flavor: 'text/plain', value: text }]);

    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
      return fallback();
    }

    navigator.clipboard.writeText(text).catch(e => {
      Zotero.ZotCard.Logger.log('navigator.clipboard.writeText failed: ' + e);
      fallback();
    });
    return true;
  },

  getClipboard() {
    return Zotero.Utilities.Internal.getClipboard("text/plain");
  }
});
