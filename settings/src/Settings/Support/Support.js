import {Textarea} from '../../components/ui/Textarea';
import {__} from '@wordpress/i18n';
import * as cmplz_api from "../../utils/api";
import {useState} from "@wordpress/element";
import {memo} from "@wordpress/element";
import Icon from "../../utils/Icon";
import DOMPurify from "dompurify";
import './Support.scss';

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
				<div className={`cmplz-support-alert cmplz-${response ? 'success' : 'warning'}`}>
					<Icon name={response ? 'circle-check' : 'error'} color={response ? 'green' : 'red'} size={16} />
					<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(responseMessage) }}  ></div> {/* nosemgrep: react-dangerouslysetinnerhtml */}
				</div>
			}
			<div>
				<button className="button button-primary"
					disabled={disabled}
					variant="secondary"
					onClick={ ( e ) => onClickHandler(e) }>
					{ __( 'Send', 'complianz-gdpr' ) }
				</button>
			</div>
		</>
	);
}
export default memo(Support);
