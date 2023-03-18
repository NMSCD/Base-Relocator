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


let bases, newBases, buttonPress;

function readJSON(JSONInput) {
	const JSONString = JSONInput.value;
	if (JSONString.includes('\\u')) {
		document.getElementById('unicodeWarn').style.display = 'block';
	} else {
		document.getElementById('unicodeWarn').style.display = '';
	}

	if (!JSONString) return;
	bases = JSON.parse(JSONString);
	listBuilder(bases);
}

function listBuilder(bases) {
	const elements = new Array;
	for (let i = 0; i < bases.length; i++) {
		const base = bases[i];
		const id = i;
		const name = base.Name;
		const element = buildListItem(id, name);
		elements.push(element);
	}
	document.getElementsByClassName('bases').forEach(element => element.innerHTML = elements.join(''));
}

function buildListItem(id, name) {
	const tagName = name ? 'div' : 'span';

	const element = document.createElement(tagName);
	element.id = id;
	element.innerText = name;

	return element.outerHTML;
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
	newBases = newArray;
}

function copyButton(input) {
	if (buttonPress) return;
	const buttonText = input.innerHTML;
	buttonPress = true;
	try { outputJSON(); } catch (error) {
		input.classList.remove('is-primary');
		input.classList.add('is-danger');
		input.innerHTML = 'Failed!';
		setTimeout(() => {
			input.classList.remove('is-danger');
			input.classList.add('is-primary');
			input.innerHTML = buttonText;
			buttonPress = false;
		}, 1500);
		console.error(error);
		return;
	}
	const copyTextContent = JSON.stringify(newBases, null, '	');		// this applies formatting and uses one tab as indent character
	navigator.clipboard.writeText(copyTextContent);

	input.innerHTML = 'Copied!';
	setTimeout(() => {
		input.innerHTML = buttonText;
		buttonPress = false;
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
	const baseElements = document.getElementsByClassName('bases');
	for (const element of baseElements) {
		element.innerHTML = '';
	}
	addToLog('Undid Edits');
}