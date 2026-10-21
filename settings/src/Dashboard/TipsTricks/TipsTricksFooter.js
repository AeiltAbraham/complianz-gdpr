import {__} from '@wordpress/i18n';
import { clsx } from '../../components/ui/cx';
import { secondaryLinkButtonCls } from '../../components/ui/downloadLink';

const TipsTricksFooter = () => {
	// Stage H.9: the raw `button button-default` external link → the C-2 secondary button look. It
	// NAVIGATES to the docs site, so it stays an `<a href>`. `cmplz-flex-push-left` is a SHARED legacy
	// layout utility (margin-inline-end:auto; its sibling `.cmplz-flex-push-right` is still used by
	// ProgressFooter) — kept as-is so the push-left footer layout (and its legacy RTL mirror) is unchanged.
	return (
		<a href="https://complianz.io/docs/"
		   className={clsx(secondaryLinkButtonCls, 'cmplz-flex-push-left')}
		   target="_blank" rel="noopener noreferrer">{__('View all', 'complianz-gdpr')}</a>
	);
};

export default TipsTricksFooter;
