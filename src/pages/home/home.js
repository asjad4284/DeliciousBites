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

	// Load persisted recipes from localStorage if available (keep the imported array reference)
	try {
		const stored = localStorage.getItem('recipesData');
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.length) {
				recipes.splice(0, recipes.length, ...parsed);
			}
		}
	} catch (e) {
		// ignore parse errors
	}

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

													// Edit button
													const editBtn = document.createElement('button');
													editBtn.type = 'button';
													editBtn.className = 'btn-edit';
													editBtn.textContent = 'Edit';
													editBtn.dataset.id = item.id;

													// Delete button
													const deleteBtn = document.createElement('button');
													deleteBtn.type = 'button';
													deleteBtn.className = 'btn-delete';
													deleteBtn.textContent = 'Delete';
													deleteBtn.dataset.id = item.id;

													actions.appendChild(editBtn);
													actions.appendChild(deleteBtn);

													card.appendChild(h3);
													card.appendChild(img);
													card.appendChild(p);
													card.appendChild(price);
													card.appendChild(actions);

													// edit handler (open modal)
													editBtn.addEventListener('click', () => {
														window.openEditModal && window.openEditModal(item);
													});

													// delete handler
													deleteBtn.addEventListener('click', () => {
														const id = Number(deleteBtn.dataset.id);
														const idx = recipes.findIndex(r => Number(r.id) === id);
														if (idx > -1) {
															recipes.splice(idx, 1);
															try { localStorage.setItem('recipesData', JSON.stringify(recipes)); } catch(e){}
															refresh();
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

			// Search & filter state and helpers
			const searchInput = document.getElementById('searchInput');
			const filterCategory = document.getElementById('filterCategory');
			const filterMinPrice = document.getElementById('filterMinPrice');
			const filterMaxPrice = document.getElementById('filterMaxPrice');
			const clearFiltersBtn = document.getElementById('clearFilters');

			const getFilteredRecipes = () => {
				let list = Array.isArray(recipes) ? recipes.slice() : [];
				const q = (searchInput && (searchInput.value || '')).toString().trim().toLowerCase();
				const cat = (filterCategory && filterCategory.value) || 'all';
				const min = filterMinPrice && filterMinPrice.value ? parseFloat(filterMinPrice.value) : null;
				const max = filterMaxPrice && filterMaxPrice.value ? parseFloat(filterMaxPrice.value) : null;

				if (q) {
					list = list.filter(r => {
						return (r.name || '').toString().toLowerCase().includes(q) || (r.description || '').toString().toLowerCase().includes(q);
					});
				}
				if (cat && cat !== 'all') {
					list = list.filter(r => r.category === cat);
				}
				if (min != null) {
					list = list.filter(r => Number(r.price) >= min);
				}
				if (max != null) {
					list = list.filter(r => Number(r.price) <= max);
				}
				return list;
			};

			const refresh = () => {
				try {
					renderMenuFromData(getFilteredRecipes());
				} catch (e) {
					// ignore
				}
			};

			// initial render using filters (empty by default)
			refresh();

			// wire search/filter inputs
			if (searchInput) searchInput.addEventListener('input', refresh);
			if (filterCategory) filterCategory.addEventListener('change', refresh);
			if (filterMinPrice) filterMinPrice.addEventListener('input', refresh);
			if (filterMaxPrice) filterMaxPrice.addEventListener('input', refresh);
			if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
				if (searchInput) searchInput.value = '';
				if (filterCategory) filterCategory.value = 'all';
				if (filterMinPrice) filterMinPrice.value = '';
				if (filterMaxPrice) filterMaxPrice.value = '';
				refresh();
			});

			// ------ Edit modal helpers and handlers ------
			const editModal = document.getElementById('editModal');
			const editForm = document.getElementById('editRecipeForm');
			const closeEditBtn = document.getElementById('closeEditModal');

			window.openEditModal = (item) => {
				if (!editModal) return;
				document.getElementById('edit-id').value = item.id || '';
				document.getElementById('edit-name').value = item.name || '';
				document.getElementById('edit-description').value = item.description || '';
				document.getElementById('edit-price').value = item.price || '';
				document.getElementById('edit-category').value = item.category || 'breakfast';
				document.getElementById('edit-image').value = item.image || '';
				editModal.classList.remove('hidden');
				const first = document.getElementById('edit-name');
				if (first) first.focus();
			};

			const closeEditModal = () => {
				if (!editModal) return;
				editModal.classList.add('hidden');
			};

			if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditModal);
			if (editModal) {
				editModal.addEventListener('click', (ev) => {
					if (ev.target === editModal) closeEditModal();
				});
			}

			if (editForm) {
				editForm.addEventListener('submit', (ev) => {
					ev.preventDefault();
					const formData = new FormData(editForm);
					const id = Number(formData.get('id'));
					const name = (formData.get('name') || '').toString().trim();
					const description = (formData.get('description') || '').toString().trim();
					const price = parseFloat(formData.get('price')) || 0;
					const category = (formData.get('category') || '').toString().trim();
					const image = (formData.get('image') || '').toString().trim();

					const idx = recipes.findIndex(r => Number(r.id) === id);
					if (idx > -1) {
						// mutate existing object so references remain consistent
						Object.assign(recipes[idx], {
							name,
							description,
							price: Number(price),
							category,
							image: image || './assets/images/pancakes.jpg'
						});
						try { localStorage.setItem('recipesData', JSON.stringify(recipes)); } catch(e){}
						refresh();
						closeEditModal();
					}
				});
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

					// persist and re-render with current filters
					try { localStorage.setItem('recipesData', JSON.stringify(recipes)); } catch(e){}
					refresh();

					// reset form
					addForm.reset();
				});
			}
});

