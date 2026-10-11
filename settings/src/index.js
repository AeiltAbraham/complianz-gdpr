import {
    render,createRoot
} from '@wordpress/element';
import './styles/tailwind.css';
// page.css is the ONLY unscoped page-level stylesheet (ADR-001). Imported after tailwind.css so it
// forms the final page-level cascade layer; it carries no Preflight/utilities and no island tokens.
import './styles/page.css';
import Page from './Page';

/**
 * Initialize
 */
function cmplzRenderSettings(container){
	if (createRoot) {
		createRoot(container).render(<Page/>);
	} else {
		render(<Page/>, container);
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'complianz-app' );
	if ( container ) {
		cmplzRenderSettings(container);
	} else {
		//delay 1000 ms and re-query, since the element may not have been parsed yet
		setTimeout(() => {
			const retryContainer = document.getElementById( 'complianz-app' );
			if (retryContainer) {
				cmplzRenderSettings(retryContainer);
			}
		},1000);
	}
});

