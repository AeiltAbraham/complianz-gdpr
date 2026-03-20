import {create} from 'zustand';
import * as cmplz_api from './api';

/**
 * Theme preference store.
 * Manages light/dark/system preference and applies the data-theme attribute.
 */
const useTheme = create((set, get) => ({
	preference: cmplz_settings.theme_preference || 'system',
	resolvedTheme: 'light',

	/**
	 * Initialize theme: apply saved preference and listen for OS changes.
	 */
	init: () => {
		const pref = get().preference;
		get().applyTheme(pref);

		// Listen for OS theme changes when in "system" mode.
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		mq.addEventListener('change', () => {
			if (get().preference === 'system') {
				get().applyTheme('system');
			}
		});
	},

	/**
	 * Cycle through light → dark → system → light.
	 */
	cycle: () => {
		const order = ['light', 'dark', 'system'];
		const current = get().preference;
		const next = order[(order.indexOf(current) + 1) % order.length];
		get().setPreference(next);
	},

	/**
	 * Set and persist the theme preference.
	 */
	setPreference: (pref) => {
		set({preference: pref});
		get().applyTheme(pref);
		get().savePreference(pref);
	},

	/**
	 * Apply data-theme attribute to #complianz wrapper.
	 */
	applyTheme: (pref) => {
		let resolved = pref;
		if (pref === 'system') {
			resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		set({resolvedTheme: resolved});

		const el = document.getElementById('complianz');
		if (el) {
			if (resolved === 'dark') {
				el.setAttribute('data-theme', 'dark');
			} else {
				el.removeAttribute('data-theme');
			}
		}
	},

	/**
	 * Save preference to usermeta via REST.
	 */
	savePreference: (pref) => {
		cmplz_api.doAction('save_theme_preference', {theme_preference: pref}).catch((error) => {
			console.error('[CMPLZ] Failed to save theme preference:', error);
		});
	},
}));

export default useTheme;
