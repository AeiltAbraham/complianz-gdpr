import {
    render,createRoot
} from '@wordpress/element';
import './styles/tailwind.css';
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
	const container = document.getElementById( 'complianz' );
	if ( container ) {
		cmplzRenderSettings(container);
	} else {
		//delay 1000 ms and try again
		setTimeout(() => {
			if (container) {
				cmplzRenderSettings(container);
			}
		},1000);
	}
});

