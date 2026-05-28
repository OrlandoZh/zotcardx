const { createApp, ref, reactive, toRaw } = Vue
const { ElLoading } = ElementPlus

window.onload = function() {
	const _l10n =  ZotElementPlus.isZoteroDev ? undefined : new Localization(["zotcard-preferences.ftl"], true);
	const defCards = ZotElementPlus.isZoteroDev ? ['a', 'b'] : Zotero.ZotCard.Consts.defCardTypes;
	let cardQuantityObserverID = null;

	window.addEventListener('unload', () => {
		if (cardQuantityObserverID) {
			Zotero.Prefs.unregisterObserver(cardQuantityObserverID);
			cardQuantityObserverID = null;
		}
	}, { once: true });

	async function _buildPreview(template) {
		if (template) {
			var items = ZotElementPlus.isZoteroDev ? [] : Zotero.ZotCard.Items.getSelectedItems('regular');
			let item;
			if (!items || items.length <= 0) {
				let allitems = ZotElementPlus.isZoteroDev ? [] : Array.from(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID, true));
				for (let index = 0; index < allitems.length; index++) {
					const e = allitems[index];
					if (e.isRegularItem()) {
						item = e;
						break;
					}
				}
			} else {
				item = items[0];
			}

			if (item) {
				let collection =item.getCollections().length > 0 ? Zotero.Collections.get(item.getCollections()[0]) : undefined;
				let noteContent = await Zotero.ZotCard.Cards.newCardWithTemplate(window, collection, item, template, undefined);
				return noteContent;
			}
		}
	}

	function _insertPrefixSuffix(textarea, prefix, suffix) {
		let selectionStart = textarea.selectionStart;
		let selectionEnd = textarea.selectionEnd;
		let start = textarea.value.substring(0, selectionStart);
		let end = textarea.value.substring(selectionEnd);
		let selection = textarea.value.substring(selectionStart, selectionEnd);
		textarea.value = start + prefix + selection + suffix + end;
		textarea.selectionStart = selectionStart + prefix.length;
		textarea.selectionEnd = textarea.selectionStart + selection.length;
		textarea.focus();
		return textarea.value;
	}

	function _insertContent(textarea, val) {
		let selectionStart = textarea.selectionStart;
		let selectionEnd = textarea.selectionEnd;
		let start = textarea.value.substring(0, selectionStart);
		let end = textarea.value.substring(selectionEnd);
		textarea.value = start + val + end;
		textarea.selectionStart = selectionStart;
		textarea.selectionEnd = selectionStart + val.length;
		textarea.focus();
		return textarea.value;
	}

	ZotElementPlus.createElementPlusApp({
		setup() {
			const ZotCardConsts = reactive(ZotElementPlus.isZoteroDev ? {} : Zotero.ZotCard.Consts);
			const curCards = reactive([]);
			const datas = reactive([]);
			const prefs = reactive({
				card_quantity: ZotElementPlus.isZoteroDev ? 0 : Zotero.ZotCard.Prefs.get('card_quantity', Zotero.ZotCard.Consts.card_quantity),
				// note_background_color: ZotElementPlus.isZoteroDev ? '' : Zotero.ZotCard.Notes.getNoteBGColor(),
				startOfWeek: ZotElementPlus.isZoteroDev ? 0 : Zotero.ZotCard.Prefs.get('startOfWeek', Zotero.ZotCard.Consts.startOfWeek.sunday),
				word_count_style: ZotElementPlus.isZoteroDev ? 1 : Zotero.ZotCard.Prefs.get('word_count_style', Zotero.ZotCard.Consts.wordCountStyle.all),
				recently_move_collection_quantity: ZotElementPlus.isZoteroDev ? 0 : Zotero.ZotCard.Prefs.get('movemgr.recently_move_collection_quantity', 5),
				imagemgr_tinify_api_key: ZotElementPlus.isZoteroDev ? 0 : Zotero.ZotCard.Prefs.get('imagemgr.tinify_api_key'),
			})
			const preview = ref('');
			const position = ref(-1);
			const searchField = ref('');
			const chars = reactive([]);
			const emojis = reactive([])
			const fields = reactive([])
			const popover = reactive({
				chars: false,
				emojis: false,
				fields: false
			});

			const _loadDatas = (quantity) => {
				curCards.splice(0, curCards.length);
				datas.splice(0, datas.length);

				for (let index = 0; index < quantity; index++) {
					curCards.push('card' + (index + 1))
				}

				[...defCards].forEach(element => {
					// { card: card, label: label, visible: visible }
					var card = ZotElementPlus.isZoteroDev ? {
						card: '11',
						label: element,
						default: 1,
						visible: false
					} : Zotero.ZotCard.Cards.initPrefs(element);
					datas.push({
						type: element,
						default: 1,
						card: card
					});
				});

				[...curCards].forEach(element => {
					// { card: card, label: label, visible: visible }
					var card = ZotElementPlus.isZoteroDev ? {
						card: '11',
						label: element,
						default: 0,
						visible: false
					} : Zotero.ZotCard.Cards.initPrefs(element);
					datas.push({
						type: element,
						default: 0,
						card: card
					});
				});
			}

			const _init = () => {
				if (!ZotElementPlus.isZoteroDev) {
					cardQuantityObserverID = Zotero.Prefs.registerObserver('zotcard.card_quantity', function () {
						var quantity = Zotero.ZotCard.Prefs.get('card_quantity', Zotero.ZotCard.Consts.card_quantity);
						_loadDatas(quantity);
					});
				}

				var quantity = ZotElementPlus.isZoteroDev ? 1 : Zotero.ZotCard.Prefs.get('card_quantity', Zotero.ZotCard.Consts.card_quantity);
				_loadDatas(quantity);

				_buildPreview(datas[0].card.card).then(e => {
					preview.value = e;
				});
				ZotElementPlus.isZoteroDev || Zotero.ZotCard.Logger.log('inited.');
			}

			const handleMenuOpen = async (index) => {
				position.value = index;
				if (index > -1) {
					preview.value = await _buildPreview(datas[position.value].card.card);
				}
			}

			const handlePrefsInput = ZotElementPlus.debounce((pref, value) => {
				var goon = true;
				switch (pref) {
					case 'card_quantity':
						
						break;
					case 'startOfWeek':
							
						break;
					case 'recently_move_collection_quantity':
							
						break;
					case 'enable_word_count':
							
						break;
					// case 'note_background_color':
					// 	goon = false;
					// 	Zotero.ZotCard.Notes.noteBGColor(value);
					// 	break;
				
					default:
						break;
				}

				if (goon) {
					ZotElementPlus.isZoteroDev || Zotero.Prefs.set(`zotcard.${pref}`, value);
				}
			}, 1000);

			const handleNoteBackgroundColorResetDefault = () => {
				Zotero.ZotCard.Notes.noteBGColor();
				// prefs.note_background_color = '';
			}

			const handleTemplateInput = ZotElementPlus.debounce(async () => {
				let template = datas[position.value].card.card;
				Zotero.ZotCard.Logger.log(template);
				template = template.replace(/(\<\/(:?h\d|p|div)\>)([^\n])/g, '$1\n$3');
				Zotero.ZotCard.Logger.log(template);
				datas[position.value].card.card = template;
				preview.value = await _buildPreview(template);
				Zotero.Prefs.set(`zotcard.${datas[position.value].type}`, template);
			}, 1000);

			const handleTemplateFocus = () => {
				popover.chars = false;
				popover.fields = false;
				popover.emojis = false;
			}

			const handleVisibleChange = () => {
				Zotero.Prefs.set(`zotcard.${datas[position.value].type}.visible`, datas[position.value].card.visible);
			};

			const handleLabelInput = ZotElementPlus.debounce(() => {
				Zotero.Prefs.set(`zotcard.${datas[position.value].type}.label`, datas[position.value].card.label);
			}, 1000);

			const handlePreview = async () => {
				preview.value = await _buildPreview(datas[position.value].card.card);
			};

			const handleResetDefault = async () => {
				if (Zotero.ZotCard.Messages.confirm(window, _l10n.formatValueSync('zotcard-reset-default'))) {
					var template;
					if (Object.hasOwnProperty.call(Zotero.ZotCard.Cards, datas[position.value].type)) {
						template = Zotero.ZotCard.Cards[datas[position.value].type].default;
					} else {
						template = '';
					}
					preview.value = await _buildPreview(template);
					Zotero.Prefs.set(`zotcard.${datas[position.value].type}`, template);
					datas[position.value].card.card = template;
				}
			}

			const handleToRSS = () => {
				Zotero.launchURL('https://github.com/OrlandoZh/zotcardx/discussions');
			}

			const handleStyles = async (type, param) => {
				let textarea = window.document.querySelector('.template textarea');
				let template;
				switch (type) {
					case 'B':
						template = _insertPrefixSuffix(textarea, '<strong>', '</strong>');
						break;
					case 'I':
						template = _insertPrefixSuffix(textarea, '<em>', '</em>');
						break;
					case 'U':
						template = _insertPrefixSuffix(textarea, '<u>', '</u>');
						break;
					case 'S':
						template = _insertPrefixSuffix(textarea, '<span style="text-decoration: line-through">', '</span>');
						break;
					case 'h1':
						template = _insertPrefixSuffix(textarea, '<h1>', '</h1>\n');
						break;
					case 'h2':
						template = _insertPrefixSuffix(textarea, '<h2>', '</h2>\n');
						break;
					case 'h3':
						template = _insertPrefixSuffix(textarea, '<h3>', '</h3>\n');
						break;
					case 'p':
						template = _insertPrefixSuffix(textarea, '<p>', '</p>\n');
						break;
					case 'pre':
						template = _insertPrefixSuffix(textarea, '<pre>', '</pre>');
						break;
					case 'blockquote':
						template = _insertPrefixSuffix(textarea, '<blockquote>', '</blockquote>');
						break;
					case 'left':
						template = _insertPrefixSuffix(textarea, '<p style="text-align: left">', '</p>\n');
						break;
					case 'center':
						template = _insertPrefixSuffix(textarea, '<p style="text-align: center">', '</p>\n');
						break;
					case 'right':
						template = _insertPrefixSuffix(textarea, '<p style="text-align: right">', '</p>\n');
						break;
					case 'color':
						template = _insertPrefixSuffix(textarea, '<span style="color: ' + param + '">', '</span>');
						break;
					case 'background-color':
						template = _insertPrefixSuffix(textarea, '<span style="background-color: ' + param + '">', '</span>');
						break;
					default:
						break;
				}

				if (template) {
					datas[position.value].card.card = template;
					preview.value = await _buildPreview(template);
					Zotero.Prefs.set(`zotcard.${datas[position.value].type}`, template);
				}
			}

			function handleFontColor(event) {
				window.document.getElementById('font-color-picker').querySelector('.el-color-picker__trigger').click();
			}

			function handleFontColorChange(value) {
				if (value) {
					handleStyles('color', value);
				}
				window.document.querySelector('.template textarea').focus();
			}

			function handleBackgroundColor(event) {
				window.document.getElementById('background-color-picker').querySelector('.el-color-picker__trigger').click();
			}

			function handleBackgroundColorChange(value) {
				if (value) {
					handleStyles('background-color', value);
				}
				window.document.querySelector('.template textarea').focus();
			}

			async function _handleInsertContent(value) {
				let textarea = window.document.querySelector('.template textarea');
				let template = _insertContent(textarea, value);
				if (template) {
					datas[position.value].card.card = template;
					preview.value = await _buildPreview(template);
					Zotero.Prefs.set(`zotcard.${datas[position.value].type}`, template);
				}
			}

			async function handleSChars(value) {
				_handleInsertContent(value);
			}

			async function handleEmojis(value) {
				popover.emojis = false;
				_handleInsertContent(value);
			}

			async function handleFileds(value) {
				popover.fields = false;
				_handleInsertContent(value);
			}
			
			function handleShowCharsPopover() {
				popover.chars = !popover.chars;
				if (popover.chars) {
					popover.fields = false;
					popover.emojis = false;
					if(chars.length === 0){
						chars.push({
							name: '<', value: '&lt;'
						}, {
							name: '>', value: '&gt;'
						}, {
							name: '<space>', value: '&nbsp;'
						}, {
							name: '&', value: '&amp;'
						}, {
							name: '"', value: '&quot;'
						}, {
							name: '\'', value: '&apos;'
						}, {
							name: ZotElementPlus.isZoteroDev ? '换行' : _l10n.formatValueSync('zotcard-preferences-line'), value: '<br/>'
						}, {
							name: ZotElementPlus.isZoteroDev ? '分割线' :  _l10n.formatValueSync('zotcard-preferences-parting'), value: '<hr/>'
						}, {
							name: '⬇︎', value: '⬇︎'
						}, {
							name: '⇩', value: '⇩'
						}, {
							name: '⬌', value: '⬌'
						}, {
							name: '➡︎', value: '➡︎'
						}, {
							name: '➤', value: '➤'
						}, {
							name: '☛', value: '☛'
						}, {
							name: '☞', value: '☞'
						}, {
							name: '➠', value: '➠'
						}, {
							name: '➽', value: '➽'
						}, {
							name: '⬅︎', value: '⬅︎'
						}, {
							name: '⬆︎', value: '⬆︎'
						}, {
							name: '🅐', value: '🅐'
						}, {
							name: '🅑', value: '🅑'
						}, {
							name: '🅒', value: '🅒'
						}, {
							name: '🅓', value: '🅓'
						}, {
							name: '🅔', value: '🅔'
						}, {
							name: '🅰', value: '🅰'
						}, {
							name: '🅱', value: '🅱'
						}, {
							name: '🅲', value: '🅲'
						}, {
							name: '🅳', value: '🅳'
						}, {
							name: '🅴', value: '🅴'
						}, {
							name: '①', value: '①'
						}, {
							name: '②', value: '②'
						}, {
							name: '③', value: '③'
						}, {
							name: '④', value: '④'
						}, {
							name: '⑤', value: '⑤'
						}, {
							name: '➊', value: '➊'
						}, {
							name: '➋', value: '➋'
						}, {
							name: '➌', value: '➌'
						}, {
							name: '➍', value: '➍'
						}, {
							name: '➎', value: '➎'
						}, {
							name: '㊀', value: '㊀'
						}, {
							name: '㊁', value: '㊁'
						}, {
							name: '㊂', value: '㊂'
						}, {
							name: '㊃', value: '㊃'
						}, {
							name: '㊄', value: '㊄'
						}, {
							name: 'Ⅰ', value: 'Ⅰ'
						}, {
							name: 'Ⅱ', value: 'Ⅱ'
						}, {
							name: 'Ⅲ', value: 'Ⅲ'
						}, {
							name: 'Ⅳ', value: 'Ⅳ'
						}, {
							name: 'Ⅴ', value: 'Ⅴ'
						}, {
							name: '®', value: '®'
						}, {
							name: '©', value: '©'
						}, {
							name: '℃', value: '℃'
						}, {
							name: '℉', value: '℉'
						}, {
							name: '⊕', value: '⊕'
						}, {
							name: '⊖', value: '⊖'
						}, {
							name: '⊗', value: '⊗'
						}, {
							name: '⦿', value: '⦿'
						}, {
							name: '⦿', value: '⦿'
						}, {
							name: '◉', value: '◉'
						}, {
							name: '▶︎', value: '▶︎'
						}, {
							name: '◀︎', value: '◀︎'
						}, {
							name: '▼', value: '▼'
						}, {
							name: '▲', value: '▲'
						}, {
							name: '★', value: '★'
						}, {
							name: '✻', value: '✻'
						}, {
							name: '❁', value: '❁'
						}, {
							name: '☑︎', value: '☑︎'
						}, {
							name: '☐', value: '☐'
						}, {
							name: '☒', value: '☒'
						}, {
							name: '☎︎', value: '☎︎'
						}, {
							name: '✉︎', value: '✉︎'
						}, {
							name: '⚠︎', value: '⚠︎'
						}, {
							name: '♾', value: '♾'
						}, {
							name: '♿︎', value: '♿︎'
						}, {
							name: '❖', value: '❖'
						}, {
							name: '✓', value: '✓'
						}, {
							name: '✕', value: '✕'
						}, {
							name: '✺', value: '✺'
						}, {
							name: '❤︎', value: '❤︎'
						}, {
							name: '◼︎', value: '◼︎'
						});
					}
				}
			}

			function handleShowEmojisPopover() {
				popover.emojis = !popover.emojis;
				
				if (popover.emojis) {
					popover.fields = false;
					popover.chars = false;
					if (emojis.length === 0) {
						emojis.push({
							name: '😀',
							values: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '🫠', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊']
						}, {
							name: '💘',
							values: ['💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤']
						}, {
							name: '🙎',
							values: ['👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🫦', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '🧔‍♂️', '🧔‍♀️', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '🧑‍🦰', '👩‍🦱', '🧑‍🦱', '👩‍🦳', '🧑‍🦳', '👩‍🦲', '🧑‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '🥷', '👷', '👷‍♂️', '👷‍♀️', '🫅', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🫃', '🫄', '🤱', '👩‍🍼', '👨‍🍼', '🧑‍🍼', '👼', '🎅', '🤶', '🧑‍🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '🧌', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂', '👣']
						}, {
							name: '🤾',
							values: ['🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍🦯', '👨‍🦯', '👩‍🦯', '🧑‍🦼', '👨‍🦼', '👩‍🦼', '🧑‍🦽', '👨‍🦽', '👩‍🦽', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '🧖‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️']
						}, {
							name: '🦊',
							values: ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿', '🦫', '🦔', '🦇', '🐻', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷', '🕸', '🦂', '🦟', '🪰', '🪱']
						}, {
							name: '🌸',
							values: ['🦠', '💐', '🌸', '💮', '🪷', '🏵', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺']
						}, {
							name: '🍅',
							values: ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🫘', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🫗', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽', '🍴', '🥄', '🔪', '🫙', '🏺']
						}, {
							name: '🚗',
							values: ['🌍', '🌎', '🌏', '🌐', '🗺', '🗾', '🧭', '🏔', '⛰', '🌋', '🗻', '🏕', '🏖', '🏜', '🏝', '🏞', '🏟', '🏛', '🏗', '🧱', '🪨', '🪵', '🛖', '🏘', '🏚', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙', '🌄', '🌅', '🌆', '🌇', '🌉', '♨', '🎠', '🛝', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎', '🏍', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣', '🛤', '🛢', '⛽', '🛞', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '🛟', '⛵', '🛶', '🚤', '🛳', '⛴', '🛥', '🚢', '✈', '🛩', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰', '🚀', '🛸', '🛎', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱', '⏲', '🕰', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡', '☀', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌', '☁', '⛅', '⛈', '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪', '🌫', '🌬', '🌀', '🌈', '🌂', '☂', '☔', '⛱', '⚡', '❄', '☃', '⛄', '☄', '🔥', '💧', '🌊']
						}, {
							name: '⚽',
							values: ['🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗', '🎟', '🎫', '🎖', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄', '🧿', '🪬', '🎮', '🕹', '🎰', '🎲', '🧩', '🧸', '🪅', '🪩', '🪆', '♠', '♥', '♦', '♣', '♟', '🃏', '🀄', '🎴', '🎭', '🖼', '🎨', '🧵', '🪡', '🧶', '🪢']
						}, {
							name: '👜',
							values: ['👓', '🕶', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑', '📿', '💄', '💍', '💎', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '🎙', '🎚', '🎛', '🎤', '🎧', '📻', '🎷', '🪗', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '📱', '📲', '☎', '📞', '📟', '📠', '🔋', '🪫', '🔌', '💻', '🖥', '🖨', '⌨', '🖱', '🖲', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞', '📽', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞', '📑', '🔖', '🏷', '💰', '🪙', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '✉', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳', '✏', '✒', '🖋', '🖊', '🖌', '🖍', '📝', '💼', '📁', '📂', '🗂', '📅', '📆', '🗒', '🗓', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇', '📏', '📐', '✂', '🗃', '🗄', '🗑', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝', '🔨', '🪓', '⛏', '⚒', '🛠', '🗡', '⚔', '🔫', '🪃', '🏹', '🛡', '🪚', '🔧', '🪛', '🔩', '⚙', '🗜', '⚖', '🦯', '🔗', '⛓', '🪝', '🧰', '🧲', '🪜', '⚗', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩼', '🩺', '🩻', '🚪', '🛗', '🪞', '🪟', '🛏', '🛋', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🫧', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰', '🪦', '⚱', '🗿', '🪧', '🪪']
						}, {
							name: '🅰️',
							values: ['🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧️', '✖️', '➕', '➖', '➗', '🟰', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈚', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲']
						}, {
							name: '🇨🇳',
							values: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿', '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹', '🇪🇺', '🇫🇮', '🇫🇯', '🇫🇰', '🇫🇲', '🇫🇴', '🇫🇷', '🇬🇦', '🇬🇧', '🇬🇩', '🇬🇪', '🇬🇫', '🇬🇬', '🇬🇭', '🇬🇮', '🇬🇱', '🇬🇲', '🇬🇳', '🇬🇵', '🇬🇶', '🇬🇷', '🇬🇸', '🇬🇹', '🇬🇺', '🇬🇼', '🇬🇾', '🇭🇰', '🇭🇲', '🇭🇳', '🇭🇷', '🇭🇹', '🇭🇺', '🇮🇨', '🇮🇩', '🇮🇪', '🇮🇱', '🇮🇲', '🇮🇳', '🇮🇴', '🇮🇶', '🇮🇷', '🇮🇸', '🇮🇹', '🇯🇪', '🇯🇲', '🇯🇴', '🇯🇵', '🇰🇪', '🇰🇬', '🇰🇭', '🇰🇮', '🇰🇲', '🇰🇳', '🇰🇵', '🇰🇷', '🇰🇼', '🇰🇾', '🇰🇿', '🇱🇦', '🇱🇧', '🇱🇨', '🇱🇮', '🇱🇰', '🇱🇷', '🇱🇸', '🇱🇹', '🇱🇺', '🇱🇻', '🇱🇾', '🇲🇦', '🇲🇨', '🇲🇩', '🇲🇪', '🇲🇫', '🇲🇬', '🇲🇭', '🇲🇰', '🇲🇱', '🇲🇲', '🇲🇳', '🇲🇴', '🇲🇵', '🇲🇶', '🇲🇷', '🇲🇸', '🇲🇹', '🇲🇺', '🇲🇻', '🇲🇼', '🇲🇽', '🇲🇾', '🇲🇿', '🇳🇦', '🇳🇨', '🇳🇪', '🇳🇫', '🇳🇬', '🇳🇮', '🇳🇱', '🇳🇴', '🇳🇵', '🇳🇷', '🇳🇺', '🇳🇿', '🇴🇲', '🇵🇦', '🇵🇪', '🇵🇫', '🇵🇬', '🇵🇭', '🇵🇰', '🇵🇱', '🇵🇲', '🇵🇳', '🇵🇷', '🇵🇸', '🇵🇹', '🇵🇼', '🇵🇾', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇸', '🇷🇺', '🇷🇼', '🇸🇦', '🇸🇧', '🇸🇨', '🇸🇩', '🇸🇪', '🇸🇬', '🇸🇭', '🇸🇮', '🇸🇯', '🇸🇰', '🇸🇱', '🇸🇲', '🇸🇳', '🇸🇴', '🇸🇷', '🇸🇸', '🇸🇹', '🇸🇻', '🇸🇽', '🇸🇾', '🇸🇿', '🇹🇦', '🇹🇨', '🇹🇩', '🇹🇫', '🇹🇬', '🇹🇭', '🇹🇯', '🇹🇰', '🇹🇱', '🇹🇲', '🇹🇳', '🇹🇴', '🇹🇷', '🇹🇹', '🇹🇻', '🇹🇿', '🇺🇦', '🇺🇬', '🇺🇲', '🇺🇳', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇦', '🇻🇨', '🇻🇪', '🇻🇬', '🇻🇮', '🇻🇳', '🇻🇺', '🇼🇫', '🇼🇸', '🇽🇰', '🇾🇪', '🇾🇹', '🇿🇦', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿']
						});
					}
				}
			}

			function handleShowFieldsPopover() {
				popover.fields = !popover.fields;

				if (popover.fields) {
					popover.emojis = false;
					popover.chars = false;
					
					if (fields.length === 0) {
						fields.push({
							name: 'ZotcardX',
							values: [
								{value: '${id}', name: ZotElementPlus.isZoteroDev ? 'id' : _l10n.formatValueSync('zotcard-preferences-id')},
								{value: '${clipboardText}', name: ZotElementPlus.isZoteroDev ? 'clipboardText' : _l10n.formatValueSync('zotcard-preferences-clipboardText')},
								{value: '${today}', name: ZotElementPlus.isZoteroDev ? 'today' : _l10n.formatValueSync('zotcard-preferences-today')},
								{value: '${month}', name: ZotElementPlus.isZoteroDev ? 'month' : _l10n.formatValueSync('zotcard-preferences-month')},
								{value: '${dayOfYear}', name: ZotElementPlus.isZoteroDev ? 'dayOfYear' : _l10n.formatValueSync('zotcard-preferences-dayOfYear')},
								{value: '${weekOfYear}', name: ZotElementPlus.isZoteroDev ? 'weekOfYear' : _l10n.formatValueSync('zotcard-preferences-weekOfYear')},
								{value: '${week}', name: '星期几'},
								{value: '${week_en}', name: 'Week(English)'},
								{value: '${now}', name: ZotElementPlus.isZoteroDev ? 'now' : _l10n.formatValueSync('zotcard-preferences-now')},
								{value: '${text}', name: ZotElementPlus.isZoteroDev ? 'text' : _l10n.formatValueSync('zotcard-preferences-text')},
								{value: '${collectionName}', name: ZotElementPlus.isZoteroDev ? 'collectionName' : _l10n.formatValueSync('zotcard-preferences-collectionName')},
								{value: '${itemLink}', name: ZotElementPlus.isZoteroDev ? 'itemLink' : _l10n.formatValueSync('zotcard-preferences-itemLink')},
								{value: '${collectionLink}', name: ZotElementPlus.isZoteroDev ? 'collectionLink' : _l10n.formatValueSync('zotcard-preferences-collectionLink')},
								{value: '${year}', name: ZotElementPlus.isZoteroDev ? 'year' : _l10n.formatValueSync('zotcard-preferences-year')},
								{value: '${tags && tags.length > 0 ? tags.join(\',\') : \'\'}', name: ZotElementPlus.isZoteroDev ? 'tags' : _l10n.formatValueSync('zotcard-preferences-tags')}]
						});
						const itemFields =  ZotElementPlus.isZoteroDev ? [] : Zotero.ItemFields.getAll().map(element => {
							let value = '${' + element.name + '}';
							let name = (Zotero.ItemFields.getLocalizedString(element.name) + `(${element.name})`) || element.name;
							return {value, name};
						});
						const creatorTypes = ZotElementPlus.isZoteroDev ? [] : Zotero.CreatorTypes.getTypes().map(element => {
							let value = '${' + element.name + 's}';
							let name = (Zotero.CreatorTypes.getLocalizedString(element.name) + `(${element.name}s)`) || element.name;
							return {value, name};
						});
						fields.push({
							name: 'Zotero',
							values: [
								...itemFields,
								{value: '${dateModified}', name: ZotElementPlus.isZoteroDev ? 'dateModified' : (_l10n.formatValueSync('zotcard-preferences-dateModified') + `(dateModified)`)},
								{value: '${dateAdded}', name: ZotElementPlus.isZoteroDev ? 'dateAdded' : (_l10n.formatValueSync('zotcard-preferences-dateAdded') + `(dateAdded)`)},
								...creatorTypes
							]
						});
					}
				}
			}

			function filterField(values) {
				return values.filter(e => e.name.toLowerCase().includes(searchField.value.toLowerCase()));
			}

			function l10n(key, params) {
			  return params ? _l10n.formatValueSync(key, params) : _l10n.formatValueSync(key);
			}
			
			_init();

			return {
				ZotCardConsts,
				datas,
				prefs,
				preview,
				position,
				chars,
				emojis,
				fields,
				popover,
				searchField,
				handleMenuOpen,
				handlePrefsInput,
				handleNoteBackgroundColorResetDefault,
				handleTemplateInput,
				handleTemplateFocus,
				handleVisibleChange,
				handleLabelInput,
				handleResetDefault,
				handleToRSS,
				handleStyles,
				handleFontColor,
				handleFontColorChange,
				handleBackgroundColor,
				handleBackgroundColorChange,
				handleSChars,
				handleEmojis,
				handleFileds,
				handleShowCharsPopover,
				handleShowEmojisPopover,
				handleShowFieldsPopover,
				filterField,
				handlePreview,
				l10n
			}
		}
	});
}
