import {Textarea} from '../../components/ui/Textarea';
import {Button} from '../../components/ui/Button';
import {__} from '@wordpress/i18n';
import * as cmplz_api from "../../utils/api";
import {useState} from "@wordpress/element";
import {memo} from "@wordpress/element";
import Icon from "../../utils/Icon";
import DOMPurify from "dompurify";

// Stage H.5 (H3, Tools): the support body migrated off Support.scss onto the C-2 design system — the
// response callout now uses the status-surface tints (`--cmplz-success-surface` / `--cmplz-danger-surface`,
// a success vs failure result) and the Send action is the shared Button primitive (FR-020: no wp-admin
// `.button`/`.button-primary`). Zero new tokens. The body renders markerless (a plain field type in the
// markerless settings frame), so every token ref carries a literal fallback (`var(--cmplz-x, <literal>)`)
// and the alert's layout avoids a `tw-border` (base.css B1 only sets border-style:solid on marked islands,
// Preflight off — a markerless border would be style:none; the tint alone carries the callout).

// Response callout — complete-literal class maps (ADR-013: no tailwind-merge). Flex row with the status
// icon; success == --cmplz-success-surface, failure == --cmplz-danger-surface (the legacy green-/red-faded
// washes, remapped to the approved C-2 tints). Body text (#0f172a) is >=15:1 on both tints (tokens.css).
const ALERT_BASE = 'tw-flex tw-items-start tw-gap-[var(--cmplz-space-xs,_8px)] tw-w-full tw-mt-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)] tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-m,_16px)] tw-rounded-[var(--cmplz-radius,_12px)]';
const ALERT_SUCCESS = 'tw-bg-[var(--cmplz-success-surface,_#e9f6ec)]';
const ALERT_FAILURE = 'tw-bg-[var(--cmplz-danger-surface,_#fdebed)]';

const Support = () => {
	const [message, setMessage] = useState('');
	const [sending, setSending] = useState(false);
	const [response, setResponse] = useState(false);
	const [responseMessage, setResponseMessage] = useState('');

	const onChangeHandler = (message) => {
		setMessage(message);
	}

	const onClickHandler = () => {
		setSending(true);
		let data = { message };
		return cmplz_api.doAction('supportData', data).then( ( response ) => {
			setResponse(response.success)
			setResponseMessage(response.message)
		});
	}

	let disabled = sending || message.length===0;
	return (
		<>
			<Textarea
				rows={4}
				// The Textarea primitive hard-codes overflow-hidden + resize-none (look-preserving the
				// field textarea, which auto-grows via JS in its own consumer). This standalone support
				// box has no auto-grow, so without this it would CLIP input past 4 rows with no way to
				// review it, where WP's TextareaControl scrolled. Inline style reliably restores vertical
				// scroll + resize — a class-append cannot override the primitive utility (ADR-013: no
				// tailwind-merge).
				style={ { overflowY: 'auto', resize: 'vertical' } }
				disabled={sending}
				placeholder={__("Type your question here","complianz-gdpr")}
				onChange={ ( e ) => onChangeHandler(e.target.value) }
			/>
			{responseMessage &&
				<div role="status" className={`${ALERT_BASE} ${response ? ALERT_SUCCESS : ALERT_FAILURE}`}>
					<Icon name={response ? 'circle-check' : 'error'} color={response ? 'green' : 'red'} size={16} />
					<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(responseMessage) }}  ></div> {/* nosemgrep: react-dangerouslysetinnerhtml */}
				</div>
			}
			<div>
				<Button
					variant="primary"
					disabled={disabled}
					onClick={ ( e ) => onClickHandler(e) }>
					{ __( 'Send', 'complianz-gdpr' ) }
				</Button>
			</div>
		</>
	);
}
export default memo(Support);
