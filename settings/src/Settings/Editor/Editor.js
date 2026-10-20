import { useState, useEffect, memo } from '@wordpress/element';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { __ } from '@wordpress/i18n';

import useFields from '../Fields/FieldsData';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

const Editor = ( { id, value, onChange } ) => {
	const [ editorState, setEditorState ] = useState( value );
	const [ view, setView ] = useState( 'wysiwyg' );
	const [ htmlValue, setHtmlValue ] = useState( value );
	const { getFieldValue, updateField, setChangedField } = useFields();

	useEffect( () => {
		if ( htmlValue === value ) {
			return;
		}

		const typingTimerHtml = setTimeout( () => {
			setEditorState( htmlValue );
		}, 500 );

		return () => {
			clearTimeout( typingTimerHtml );
		};
	}, [ htmlValue ] );

	useEffect( () => {
		if ( editorState === value ) {
			return;
		}

		const typingTimer = setTimeout( () => {
			updateField( id, editorState );
			setHtmlValue( editorState );
			setChangedField( id, editorState );
			onChange( editorState );
		}, 500 );

		return () => {
			clearTimeout( typingTimer );
		};
	}, [ editorState ] );

	useEffect( () => {
		setEditorState( value );
	}, [ getFieldValue( id ) ] );

	const toggleView = () => {
		if ( view === 'wysiwyg' ) {
			setView( 'html' );
		} else {
			setView( 'wysiwyg' );
		}
	};

	const onChangeHtml = ( html ) => {
		setHtmlValue( html );
		setEditorState( html );
	};

	return (
		// `data-cmplz-ui` marks this container so the migrated primitives (toggle Button + HTML Textarea)
		// get the scoped base reset (B1 border-style under Preflight-off, T-052). The CKEditor below sits in
		// its own `data-cmplz-isolate="ckeditor"` zone, which the base reset explicitly EXCLUDES even under a
		// `[data-cmplz-ui]` ancestor (base.css `:not([data-cmplz-isolate] *)`), so the retained widget is
		// untouched — safe to mark this container (no unmigrated raw bodies live outside the isolate zone).
		<div
			data-cmplz-ui
			className="cmplz-editor tw-flex tw-flex-col tw-gap-[var(--cmplz-space-xs,_8px)] tw-items-start"
		>
			<Button variant="secondary" onClick={ ( e ) => toggleView() }>
				{ view === 'wysiwyg'
					? 'HTML'
					: __( 'Editor', 'complianz-gdpr' ) }
			</Button>
			{ view === 'html' && (
				// a11y-exemptions.md must-fix #2: the HTML-view textarea had no label. The Textarea primitive
				// carries an `aria-label` so it has an accessible name.
				<Textarea
					rows="8"
					className="tw-self-stretch"
					aria-label={ __( 'HTML source', 'complianz-gdpr' ) }
					onChange={ ( e ) => onChangeHtml( e.target.value ) }
					value={ htmlValue }
				/>
			) }
			{ view === 'wysiwyg' && (
				// CKEditor 5 is a retained third-party widget (C-5): frame-only (maintainer sign-off B,
				// 2026-10-20) — its upstream, a11y-audited toolbar/editable stay as-is inside the ADR-001 §4.1
				// `data-cmplz-isolate="ckeditor"` zone (base reset skipped). The zone host carries the C-2 field
				// frame; `tw-border-solid` sets the border-style explicitly (B1 skipped in the zone, T-052).
				<div
					data-cmplz-isolate="ckeditor"
					className="cmplz-ckeditor tw-self-stretch tw-overflow-hidden tw-rounded-[var(--cmplz-radius-field,_6px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-field-border,_#94a3b8)]"
				>
					<CKEditor
						editor={ ClassicEditor }
						config={ {
							toolbar: [
								'undo',
								'redo',
								'heading',
								'|',
								'bold',
								'italic',
								'link',
								'bulletedList',
								'numberedList',
								'blockQuote',
								'insertTable',
							],
						} }
						data={ editorState }
						onChange={ ( event, editor ) => {
							const data = editor.getData();
							setEditorState( data );
						} }
					/>
				</div>
			) }
		</div>
	);
};

export default memo( Editor );
