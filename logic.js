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


const baseData = new Object;

function readJSON(JSONInput) {
	const JSONString = JSONInput.value;
	const unicodeWarn = document.getElementById('unicodeWarn');
	const isUnicodePresent = JSONString.includes('\\u');
	unicodeWarn.style.display = isUnicodePresent ? 'block' : '';

	if (!JSONString) return;
	delete baseData.bases;
	baseData.bases = JSON.parse(JSONString);
	Object.freeze(baseData.bases);		// freezing the object so we can be sure it can't been tampered with
	listBuilder();
}

function listBuilder() {
	const bases = baseData.bases
	const elements = new Array;
	for (let i = 0; i < bases.length; i++) {
		const base = bases[i];
		const id = i;
		const name = base.Name;
		const element = buildListItem(id, name);
		elements.push(element);
	}
	const baseElements = document.getElementsByClassName('bases');
	for (const element of baseElements) {
		element.innerHTML = elements.join('');
	}
}

function buildListItem(id, name) {
	const tagName = name ? 'div' : 'span';

	const element = document.createElement(tagName);
	element.id = id;
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

function getDivOrder() {
	const divIds = new Array;
	const divs = Array.from(document.getElementById('bases').children);
	for (const div of divs) {
		if (isNaN(div.id)) continue;
		divIds.push(parseInt(div.id));
	}
	return divIds;
}

function outputJSON() {
	const newArray = new Array;
	const divOrder = getDivOrder();
	for (let i = 0; i < bases.length; i++) {
		newArray[i] = bases[divOrder[i]];
	}
	baseData.newBases = newArray;
}

function copyButton(input) {
	input.style.pointerEvents = 'none';
	const buttonText = input.innerText;
	try { outputJSON(); } catch (error) {
		input.classList.remove('is-primary');
		input.classList.add('is-danger');
		input.innerText = 'Failed!';
		setTimeout(() => {
			input.classList.remove('is-danger');
			input.classList.add('is-primary');
			input.innerText = buttonText;
			input.style.pointerEvents = '';
		}, 1500);
		return;
	}
	const copyTextContent = JSON.stringify(baseData.newBases, null, '	');		// this applies formatting and uses one tab as indent character
	navigator.clipboard.writeText(copyTextContent);

	input.innerText = 'Copied!';
	setTimeout(() => {
		input.innerText = buttonText;
		input.style.pointerEvents = '';
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
	addToLog('Undid Edits');
}