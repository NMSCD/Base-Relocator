(() => {
	const directions = ['left', 'right'];
	function buildColumn(direction) {
		const template = `
		<div class="column" id="${direction}">
			<input type="text" placeholder="🔎 Search" class="input" oninput="filterList(this)">
			<div class="bases"></div>
		</div>`;
		return template;
	}
	const outputElement = document.querySelector('#output .columns');
	const children = outputElement.children;
	outputElement.insertAdjacentHTML('afterbegin', buildColumn(directions[0]));
	Array.from(children).at(-1).insertAdjacentHTML('beforebegin', buildColumn(directions[1]));
})();

// has this structure: { bases: {}, newBases: {} }
const baseData = new Object;

function readJSON(JSONInput) {
	const JSONString = JSONInput.value;
	const unicodeWarn = document.getElementById('unicodeWarn');
	const isUnicodePresent = JSONString.includes('\\u');
	unicodeWarn.style.display = isUnicodePresent ? 'block' : '';

	if (!JSONString) return;
	delete baseData.bases;
	delete baseData.newBases;
	baseData.bases = JSON.parse(JSONString);
	Object.freeze(baseData.bases);		// freezing the object so we can be sure it can't been tampered with
	listBuilder();
}

function listBuilder() {
	const baseElements = document.getElementsByClassName('bases');
	for (const element of baseElements) {
		element.style.willChange = 'contents';
	}
	const bases = baseData.bases
	const elements = new Array;
	for (let i = 0; i < bases.length; i++) {
		const base = bases[i];
		const id = i;
		const name = base.Name;
		const element = buildListItem(id, name);
		elements.push(element);
	}
	const combinedHTML = elements.join('');
	for (const element of baseElements) {
		element.innerHTML = combinedHTML;
		element.style.willChange = '';
	}
}

function buildListItem(id, name) {
	const tagName = name ? 'div' : 'span';

	const element = document.createElement(tagName);
	element.dataset.id = id;
	element.innerText = name;
	element.setAttribute('onclick', 'highlightBase(this)');

	return element.outerHTML;
}

function highlightBase(element) {
	const baseList = element.closest('.bases');
	const prev = baseList.querySelector('.clicked')
	prev?.classList.remove('clicked');
	if (prev != element) element.classList.add('clicked');
}

function swapBases(button) {
	button.style.pointerEvents = 'none';
	const buttonText = button.innerText;
	const selectedElements = document.getElementsByClassName('clicked');
	if (selectedElements.length != 2 || selectedElements[0].dataset.id == selectedElements[1].dataset.id) {
		button.classList.remove('is-primary');
		button.classList.add('is-danger');
		button.innerText = 'Failed!';
		setTimeout(() => {
			button.classList.remove('is-danger');
			button.classList.add('is-primary');
			button.innerText = buttonText;
			button.style.pointerEvents = '';
		}, 1500);
		return;
	}
	const newBases = baseData.newBases ??= structuredClone(baseData.bases);
	const ids = new Array;
	for (const element of selectedElements) {
		ids.push(element.dataset.id);
	}
	const oldBaseObjects = structuredClone(newBases[ids[0]].Objects);
	const newBaseObjects = structuredClone(newBases[ids[1]].Objects);
	newBases[ids[0]].Objects = newBaseObjects;
	newBases[ids[1]].Objects = oldBaseObjects;

	button.innerText = 'Swapped!';
	addToLog(`Swapped "${selectedElements[0].innerText}" and "${selectedElements[1].innerText}"`);
	setTimeout(() => {
		button.innerText = buttonText;
		button.style.pointerEvents = '';
	}, 1500)
}

function copyButton(button) {
	button.style.pointerEvents = 'none';
	const buttonText = button.innerText;
	if (!baseData.newBases) {
		button.classList.remove('is-primary');
		button.classList.add('is-danger');
		button.innerText = 'Failed!';
		setTimeout(() => {
			button.classList.remove('is-danger');
			button.classList.add('is-primary');
			button.innerText = buttonText;
			button.style.pointerEvents = '';
		}, 1500);
		return;
	}
	const copyTextContent = JSON.stringify(baseData.newBases, null, '	');		// this applies formatting and uses one tab as indent character
	navigator.clipboard.writeText(copyTextContent);
	button.innerText = 'Copied!';

	setTimeout(() => {
		button.innerText = buttonText;
		button.style.pointerEvents = '';
	}, 1500)
}

function filterList(inputElement) {
	const searchText = inputElement.value.trim().toLowerCase();
	const baseList = inputElement.nextElementSibling.children;

	for (const base of baseList) {
		const baseName = base.innerText.toLowerCase();
		if (!searchText || baseName.includes(searchText)) {
			base.style.display = '';
		} else {
			base.style.display = 'none';
		}
	}
}

function addToLog(text) {
	const logElement = document.getElementById('actionlog');
	const div = document.createElement('div');
	div.innerText = text;
	div.classList.add('logItem');
	logElement.appendChild(div);
}

function reset() {
	if (!baseData.bases) return;
	const baseElements = document.getElementsByClassName('bases');
	for (const element of baseElements) {
		element.innerHTML = '';
	}
	listBuilder();
	baseData.newBases = structuredClone(baseData.bases);
	addToLog('Undid Edits');
}