// Basic home page script — sets app name and provides a small fallback tab system
import { recipes } from '../../../database/recipe.js';

document.addEventListener('DOMContentLoaded', () => {
	// Set application name in the navbar (uses localStorage if set)
	const appNameEl = document.getElementById('appName');
	if (appNameEl) {
		appNameEl.textContent = localStorage.getItem('appName') || 'Delicious Bites';
	}

	// Simple tabs fallback in case Flowbite tabs are not initialized
	const tabButtons = Array.from(document.querySelectorAll('[data-tabs-target]'));
	const tabPanels = Array.from(document.querySelectorAll('#menuTabContent > div[role="tabpanel"]'));

	const activateTabById = (id, buttonEl) => {
		tabPanels.forEach(panel => {
			if (panel.id === id) panel.classList.remove('hidden');
			else panel.classList.add('hidden');
		});

		tabButtons.forEach(btn => {
			btn.classList.remove('text-red-500', 'border-red-500');
			btn.setAttribute('aria-selected', 'false');
		});
		if (buttonEl) {
			buttonEl.classList.add('text-red-500', 'border-red-500');
			buttonEl.setAttribute('aria-selected', 'true');
		}
	};

	tabButtons.forEach(btn => {
		const target = btn.getAttribute('data-tabs-target');
		if (!target) return;
		btn.addEventListener('click', () => {
			const id = target.replace('#', '');
			activateTabById(id, btn);
		});
	});

	// Activate breakfast tab by default if present
	const breakfastTab = document.getElementById('breakfast-tab');
	if (breakfastTab) breakfastTab.click();
	else if (tabButtons.length) tabButtons[0].click();

			// Render menu from recipes array into the tab panels (uses Array.map)
			const renderMenuFromData = (items) => {
				const categories = ['breakfast', 'lunch', 'dinner', 'desserts'];
				categories.forEach(cat => {
					const panel = document.getElementById(cat);
					if (!panel) return;

					const catItems = items.filter(i => i.category === cat);

					const grid = document.createElement('div');
					grid.className = 'menu-grid';

					if (catItems.length === 0) {
						grid.innerHTML = '<p>No items available.</p>';
					} else {
						// Use map to create card elements and append them
												catItems.map(item => {
													const card = document.createElement('div');
													card.className = 'menu-item';

													const img = document.createElement('img');
													img.src = item.image || './assets/images/pancakes.jpg';
													img.alt = item.name;
													img.loading = 'lazy';

													const h3 = document.createElement('h3');
													h3.textContent = item.name;

													const p = document.createElement('p');
													p.textContent = item.description;

													const price = document.createElement('p');
													price.className = 'price';
													price.textContent = `$${Number(item.price).toFixed(2)}`;

													// actions: edit / delete
													const actions = document.createElement('div');
													actions.className = 'card-actions';

													const deleteBtn = document.createElement('button');
													deleteBtn.type = 'button';
													deleteBtn.className = 'btn-delete';
													deleteBtn.textContent = 'Delete';
													deleteBtn.dataset.id = item.id;

													actions.appendChild(deleteBtn);

													card.appendChild(h3);
													card.appendChild(img);
													card.appendChild(p);
													card.appendChild(price);
													card.appendChild(actions);

													// delete handler
													deleteBtn.addEventListener('click', () => {
														const id = Number(deleteBtn.dataset.id);
														const idx = recipes.findIndex(r => Number(r.id) === id);
														if (idx > -1) {
															recipes.splice(idx, 1);
															renderMenuFromData(recipes);
														}
													});


													grid.appendChild(card);
													return card;
												});
					}

					// Clear existing content and append generated grid
					panel.innerHTML = '';
					panel.appendChild(grid);
				});
			}

		// call render
		try {
			renderMenuFromData(recipes);
		} catch (e) {
			// if import fails or recipes isn't available, do nothing
			// console.warn('Could not render menu from data', e);
		}

			// Handle add recipe form submission (Step 3)
			const addForm = document.getElementById('addRecipeForm');
			if (addForm) {
				addForm.addEventListener('submit', (ev) => {
					ev.preventDefault();
					const formData = new FormData(addForm);
					const name = (formData.get('name') || '').toString().trim();
					const description = (formData.get('description') || '').toString().trim();
					const price = parseFloat(formData.get('price')) || 0;
					const category = (formData.get('category') || '').toString().trim();
					const image = (formData.get('image') || '').toString().trim();

					if (!name || !description || !category) {
						return; // simple validation
					}

						// Edit functionality removed per user request. Only Add/Delete remain.

					// generate new id
					const maxId = recipes.reduce((m, r) => Math.max(m, r.id || 0), 0);
					const newObj = {
						id: maxId + 1,
						name,
						description,
						price: Number(price),
						category,
						image: image || './assets/images/pancakes.jpg'
					};

					// mutate exported array
					recipes.push(newObj);

					// re-render menu
					renderMenuFromData(recipes);

					// reset form
					addForm.reset();
				});
			}
});

