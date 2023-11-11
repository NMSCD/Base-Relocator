import 'bulma';
import './styles.scss';

const baseData: {
	bases?: string;
	newBases?: string;
	copy?: boolean;
	buttonText?: string;
} = {};

(() => {
	checkboxChange((document.getElementById('copyCheckbox') as HTMLInputElement).checked);
	readJSON((document.getElementById('JSONinput') as HTMLTextAreaElement));

	const directions = ['left', 'right'];
	const outputElement = document.querySelector('#output .columns') as HTMLDivElement;
	const children = outputElement.children;
	outputElement.insertAdjacentElement('afterbegin', buildColumn(directions[0]));
	Array.from(children).at(-1)!.insertAdjacentElement('beforebegin', buildColumn(directions[1]));

	function buildColumn(direction: string): HTMLDivElement {
		const wrapperDiv = document.createElement('div');
		const searchInput = document.createElement('input');
		const listDiv = document.createElement('div');

		wrapperDiv.classList.add('column');
		wrapperDiv.id = direction;

		searchInput.type = 'text';
		searchInput.placeholder = '🔎 Search';
		searchInput.classList.add('input');
		searchInput.addEventListener('input', function () { filterList(this as unknown as HTMLInputElement) });

		listDiv.classList.add('bases');

		wrapperDiv.appendChild(searchInput);
		wrapperDiv.appendChild(listDiv);

		return wrapperDiv;
	}
})();

type ListItem = HTMLDivElement | HTMLSpanElement;

// event listeners
document.getElementById('copyCheckbox')?.addEventListener('change', function () { checkboxChange((this as unknown as HTMLInputElement).checked) });
document.getElementById('reset')?.addEventListener('click', () => reset());
document.getElementById('copy')?.addEventListener('click', function () { copyButton(this as unknown as HTMLButtonElement) });
document.getElementById('swap')?.addEventListener('click', function () { swapBases(this as unknown as HTMLButtonElement) });
document.getElementById('JSONinput')?.addEventListener('input', function () { readJSON(this as unknown as HTMLTextAreaElement) });

function readJSON(jsonInput: HTMLTextAreaElement): void {
	const jsonString = jsonInput.value;
	delete baseData.bases;
	delete baseData.newBases;
	baseData.bases = jsonString;
	const isValid = validateJSON(jsonString);

	if (!isValid) {
		if (jsonString) {
			warn('JSON is not correctly formatted. Please make sure you copied the whole PersistentPlayerBases section.', true);
		}
		const baseElements = document.getElementsByClassName('bases');
		for (const element of Array.from(baseElements)) {
			element.innerHTML = '';
		}
		return;
	}

	listBuilder();
}

function validateJSON(jsonData: string): boolean {
	try {
		JSON.parse(baseData.bases as string);
		return true
	} catch (error) {
		if (jsonData) console.warn('JSON error detected: ', error)
		return false;
	}
}


function warn(warning: string, show: boolean): void {
	const warnElement = document.getElementById('warning') as HTMLParagraphElement;
	warnElement.innerHTML = warning;
	warnElement.style.display = show ? 'block' : '';
}

function listBuilder() {
	const baseElements = document.getElementsByClassName('bases');
	for (const element of Array.from(baseElements)) {
		(element as HTMLElement).style.willChange = 'contents';
	}

	const bases = JSON.parse(baseData.bases as string);
	const listItems: Array<HTMLElement> = [];
	for (let i = 0; i < bases.length; i++) {
		const base = bases[i];
		if (base.BaseType.PersistentBaseTypes === 'ExternalPlanetBase') continue;
		const id = i;
		const name = base.Name;
		const listItem = buildListItem(id, name);
		listItems.push(listItem);
	}

	for (const element of Array.from(baseElements)) {
		element.innerHTML = '';

		for (const listItem of listItems) {
			const newItem = listItem.cloneNode(true);
			newItem.addEventListener('click', (e) => highlightBase(e.target as ListItem));
			element.appendChild(newItem);
		}
		(element as HTMLElement).style.willChange = '';
	}
}

function buildListItem(id: number, name: string) {
	const tagName = name ? 'div' : 'span';

	const element = document.createElement(tagName) as ListItem;
	element.dataset.id = id.toString();
	element.innerText = name;

	return element;
}

function highlightBase(element: ListItem) {
	const baseList = element.closest('.bases');
	const prev = baseList?.querySelector('.clicked')
	prev?.classList.remove('clicked');
	if (prev != element) element.classList.add('clicked');
}

function swapBases(button: HTMLButtonElement) {
	button.style.pointerEvents = 'none';
	const selectedElements = Array.from(document.getElementsByClassName('clicked')) as Array<HTMLElement>;
	if (selectedElements.length !== 2 || !selectedElements[0] || !selectedElements[1] || selectedElements[0]?.dataset?.id === selectedElements[1]?.dataset?.id) {
		button.classList.remove('is-primary');
		button.classList.add('is-danger');
		if (selectedElements.length !== 2) {
			button.innerText = 'Must select 2 bases!';
		} else if (!selectedElements[0] || !selectedElements[1] || selectedElements[0]?.dataset?.id === selectedElements[1]?.dataset?.id) {
			button.innerText = "Same base selected twice!";
		} else {
			button.innerText = 'Failed! (unknown cause)';
		}
		setTimeout(() => {
			button.classList.remove('is-danger');
			button.classList.add('is-primary');
			button.innerText = baseData.buttonText as string;
			button.style.pointerEvents = '';
		}, 1500);
		return;
	}
	const newBaseJsonString = baseData.newBases ??= baseData.bases as string;
	const newBases = JSON.parse(newBaseJsonString);
	const ids: Array<string> = [];
	for (const element of selectedElements) {
		ids.push(element.dataset.id as string);
	}
	const oldBaseObjects = structuredClone(newBases[ids[0]].Objects);
	const newBaseObjects = structuredClone(newBases[ids[1]].Objects);
	newBases[ids[1]].Objects = oldBaseObjects;
	if (!baseData.copy) newBases[ids[0]].Objects = newBaseObjects;
	baseData.newBases = JSON.stringify(newBases);

	const operation = baseData.copy ? 'Copied' : 'Swapped';
	button.innerText = `${operation}!`;
	addToLog(`${operation} "${selectedElements[0].innerText}" ${baseData.copy ? 'to' : 'and'} "${selectedElements[1].innerText}"`);

	setTimeout(() => {
		button.innerText = baseData.buttonText as string;
		button.style.pointerEvents = '';
	}, 1500)
}

function copyButton(button: HTMLButtonElement) {
	button.style.pointerEvents = 'none';
	const buttonText = button.innerText;
	if (!baseData.newBases) {
		button.classList.remove('is-primary');
		button.classList.add('is-danger');
		button.innerText = 'No changes to copy!';
		setTimeout(() => {
			button.classList.remove('is-danger');
			button.classList.add('is-primary');
			button.innerText = buttonText;
			button.style.pointerEvents = '';
		}, 1500);
		return;
	}
	const baseJson = JSON.parse(baseData.newBases);
	const copyTextContent = JSON.stringify(baseJson, null, '\t');		// NoSonar this applies formatting and uses one tab as indent character
	navigator.clipboard.writeText(copyTextContent);
	button.innerText = 'Copied!';

	setTimeout(() => {
		button.innerText = buttonText;
		button.style.pointerEvents = '';
	}, 1500)
}

function filterList(inputElement: HTMLInputElement) {
	const searchText = inputElement.value.trim().toLowerCase();
	const baseList = inputElement.nextElementSibling!.children;

	for (const base of Array.from(baseList)) {
		const baseElement = base as HTMLElement;
		const baseName = baseElement.innerText.toLowerCase();
		if (!searchText || baseName.includes(searchText)) {
			baseElement.style.display = '';
		} else {
			baseElement.style.display = 'none';
		}
	}
}

function addToLog(text: string) {
	const logElement = document.getElementById('actionlog');
	const div = document.createElement('div');
	div.innerText = text;
	div.classList.add('logItem');
	logElement?.appendChild(div);
}

function reset() {
	if (!baseData.bases) return;
	const baseElements = document.getElementsByClassName('clicked');
	for (const element of Array.from(baseElements)) {
		element.classList.remove('clicked');
	}
	baseData.newBases = JSON.parse(baseData.bases);
	addToLog('Undid Edits');
}

function checkboxChange(bool: boolean) {
	baseData.copy = bool;
	const wrapper = document.querySelector('#output .columns .arrow');
	wrapper?.classList.toggle('copy', bool);
	wrapper?.classList.toggle('swap', !bool);

	const swapButton = document.getElementById('swap');
	baseData.buttonText = bool ? 'Copy Selected Base' : 'Swap Selected Bases';
	if (!swapButton?.style?.pointerEvents) swapButton!.innerText = baseData.buttonText;
}