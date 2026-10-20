import { memo, useEffect, useState } from '@wordpress/element';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-css';
// Light Ace theme (maintainer sign-off A, 2026-10-20, design/editor-scan.md §5-A): the editor was the dark
// `monokai` theme; the surrounding C-2 app is light, so it switches to the light `github` theme to match.
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import { __ } from '@wordpress/i18n';
import Icon from '../../utils/Icon';
import { clsx } from '../../components/ui/cx';

const AceEditorControl = ( props ) => {
	const mode = props.mode ? props.mode : 'css';
	const height = props.height ? props.height : '200px';
	const placeholder =
		props.field && props.field.default
			? props.field.default
			: props.placeholder;
	const [ inputValue, setInputValue ] = useState( props.value );
	const [ scriptWarning, setScriptWarning ] = useState( false );
	//because an update on the entire Fields array is costly, we only update after the user has stopped typing
	useEffect( () => {
		if ( inputValue === props.value ) {
			return;
		}
		const typingTimer = setTimeout( () => {
			props.onChange( inputValue );
		}, 500 );

		return () => {
			clearTimeout( typingTimer );
		};
	}, [ inputValue ] );

	const handleChange = ( value ) => {
		//strip off <script> tags
		if ( value.includes( '<script>' ) || value.includes( '</script>' ) ) {
			setScriptWarning( true );
		}
		value = value.replace( /<script>/gi, '' );
		value = value.replace( /<\/script>/gi, '' );
		setInputValue( value );
	};

	return (
		// Disabled dim reproduces the deleted AceEditor.scss `.cmplz-editor-disabled { opacity:0.125 }`.
		<div
			className={ clsx(
				'cmplz-editor-container',
				props.disabled && 'tw-opacity-[0.125]'
			) }
		>
			{ scriptWarning && (
				// Danger inline notice — reproduces the legacy `.cmplz-error-text` look with tw- utilities and
				// drops the legacy class hook (T-045 pattern). Markerless; the `--cmplz-danger` token resolves on
				// `#complianz-app` (Bundle A) and carries a literal fallback.
				<div className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)] tw-mb-[var(--cmplz-space-2xs,_4px)]">
					<Icon name={ 'error' } size={ 13 } color={ 'red' } />
					<p className="tw-m-0 tw-text-[color:var(--cmplz-danger,_#d7263d)]">
						{ __(
							'Write your JavaScript without wrapping it in script tags.',
							'complianz-gdpr'
						) }
					</p>
				</div>
			) }
			{ /* react-ace is a retained third-party widget (C-5): it keeps its own (now light) theme inside the
			    ADR-001 §4.1 `data-cmplz-isolate="ace"` zone, so the base reset (base.css B1-B5) skips its internal
			    DOM. The zone host carries the C-2 field FRAME via tw- utilities; because B1 is skipped here,
			    `tw-border-solid` sets the border-style explicitly (the T-052 Preflight-off lesson). */ }
			<div
				data-cmplz-isolate="ace"
				className="tw-overflow-hidden tw-rounded-[var(--cmplz-radius-field,_6px)] tw-border tw-border-solid tw-border-[color:var(--cmplz-field-border,_#94a3b8)]"
			>
				<AceEditor
					readOnly={ props.disabled }
					placeholder={ '//' + placeholder } //make it look like a comment
					mode={ mode }
					theme="github"
					width="100%"
					height={ height }
					onChange={ ( value ) => handleChange( value ) }
					fontSize={ 12 }
					showPrintMargin={ true }
					showGutter={ true }
					highlightActiveLine={ true }
					value={ inputValue }
					setOptions={ {
						enableBasicAutocompletion: false,
						enableLiveAutocompletion: false,
						enableSnippets: false,
						showLineNumbers: true,
						tabSize: 2,
						useWorker: false,
					} }
				/>
			</div>
		</div>
	);
};
export default memo( AceEditorControl );
