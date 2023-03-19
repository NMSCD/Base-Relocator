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

// has this structure: { bases: {}, newBases: {}, copy: Bool, buttonText: String }
const baseData = new Object;

function readJSON(jsonInput) {
	const jsonString = jsonInput.value;
	const isUnicodePresent = jsonString.includes('\\u');
	warn(`Potential unicode characters detected in JSON. This could lead to basenames showing up weirdly in
		this list and in the game.
		<br>
		To resolve this issue, use the NomNom save editor (linked below) to
		copy the JSON.`, isUnicodePresent);
	delete baseData.bases;
	delete baseData.newBases;
	try {
		baseData.bases = JSON.parse(jsonString);
	} catch (error) {
		console.warn('JSON error detected: ', error)
		if (jsonString) warn('JSON is not correctly formatted. Please make sure you copied the whole PersistentPlayerBases section.', true);
		const baseElements = document.getElementsByClassName('bases');
		for (const element of baseElements) {
			element.innerHTML = '';
		}
		return;
	}
	Object.freeze(baseData.bases);		// freezing the object so we can be sure it can't been tampered with
	listBuilder();
}

function warn(warning, show) {
	const warnElement = document.getElementById('warning');
	warnElement.innerHTML = warning;
	warnElement.style.display = show ? 'block' : '';
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
	const selectedElements = document.getElementsByClassName('clicked');
	if (selectedElements.length != 2 || !selectedElements[0] || !selectedElements[1] || selectedElements[0]?.dataset?.id == selectedElements[1]?.dataset?.id) {
		button.classList.remove('is-primary');
		button.classList.add('is-danger');
		button.innerText = 'Failed!';
		setTimeout(() => {
			button.classList.remove('is-danger');
			button.classList.add('is-primary');
			button.innerText = baseData.buttonText;
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
	newBases[ids[1]].Objects = oldBaseObjects;
	if (!baseData.copy) newBases[ids[0]].Objects = newBaseObjects;

	const operation = baseData.copy ? 'Copied' : 'Swapped';
	button.innerText = `${operation}!`;
	addToLog(`${operation} "${selectedElements[0].innerText}" ${baseData.copy ? 'to' : 'and'} "${selectedElements[1].innerText}"`);

	setTimeout(() => {
		button.innerText = baseData.buttonText;
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
	const baseElements = document.getElementsByClassName('clicked');
	for (const element of baseElements) {
		element.classList.remove('clicked');
	}
	baseData.newBases = structuredClone(baseData.bases);
	addToLog('Undid Edits');
}

function checkboxChange(bool) {
	baseData.copy = bool;
	const wrapper = document.querySelector('#output .columns .arrow');
	wrapper.classList.toggle('copy', bool);
	wrapper.classList.toggle('swap', !bool);

	const swapButton = document.getElementById('swap');
	baseData.buttonText = bool ? 'Copy Selected Base' : 'Swap Selected Bases';
	if (!swapButton?.style?.pointerEvents) swapButton.innerText = baseData.buttonText;
}