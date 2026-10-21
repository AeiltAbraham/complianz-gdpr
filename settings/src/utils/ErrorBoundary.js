import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../components/ui/Button';

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
		this.resetError = this.resetError.bind(this);
	}

	static getDerivedStateFromError(error) {
		return { hasError: true };
	}


	componentDidCatch(error, errorInfo) {
		this.setState({ error, errorInfo });
		// You can also log the error to an error reporting service
		console.log('ErrorBoundary', error, errorInfo);
	}


	resetError() {
		this.setState({ hasError: false, error: null, errorInfo: null });
	}

	render() {
		if (this.state.hasError) {
			// Migrated to the C-2 system (Stage H.8): the container padding (the only rule the retired
			// `.cmplz-error-boundary` carried) becomes a tw- token utility, and the raw `button
			// button-primary` becomes the `ui/Button` primary primitive. Markerless (this renders when the
			// React tree crashes), so `tw-border-solid` pins the border-style (Preflight off, B1 not in
			// scope — T-052) and the padding uses a token-with-literal-fallback. The reload handler was a
			// dead no-op (`onClick={(e) => function(){…}}` returned a function, never reloaded) — fixed to
			// its clear intent so "Try Again" reloads the page.
			return (
				<div className="tw-p-[var(--cmplz-space-l,_24px)]">
					<h3 className="cmplz-h4">Something went wrong.</h3>

					{/* You can render any custom fallback UI */}
					<p>{this.props.fallback}</p>
					<Button variant="primary" className="tw-border-solid" onClick={() => window.location.reload()}>Try Again</Button>
				</div>
			);
		}

		return this.props.children;
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node,
	fallback: PropTypes.node,
};

export default ErrorBoundary;
