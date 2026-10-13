// Tips & Tricks (T-048). Migrated off assets/css/admin/modules/tips-tricks.scss onto tw- utilities on the
// semantic tokens WITH LITERAL FALLBACKS (design/dashboard-preview.html). Markerless; the info glyph fill
// uses --cmplz-text-muted with a literal fallback so it renders coloured outside an island (and clears the
// ADR-004/T-018 ban on legacy token names in settings/src).
const Tip = ({link, content}) => {
    return (
        <div className="cmplz-tips-tricks-element tw-min-w-0">
			<a href={link} target="_blank" rel="noopener noreferrer" title={content}
			   className="tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-min-w-0 tw-no-underline tw-text-[color:var(--cmplz-text-muted,_#475569)] hover:tw-text-[color:var(--cmplz-accent-strong,_#1e73be)] hover:tw-underline">
                <div className="cmplz-icon tw-flex-none">
                    <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height="15">
                        <path fill="var(--cmplz-text-muted, #475569)" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"/>
                    </svg>
                </div>
                <div className="cmplz-tips-tricks-content tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis">{content}</div>
            </a>
        </div>
    )
}
const TipsTricks = () => {
	const items = [
		{
			content: "Excluding/Deferring Complianz from Caching plugins",
			link: "https://complianz.link/VoIVo5L"
		},
		{
			content: "Simplified Guide to Google Consent Mode v2",
			link: "https://complianz.link/ro0W1dn"
		},
		{
			content: "Customize your banner - CSS Lessons",
			link: "https://complianz.link/C7rh74D"
		},
		{
			content: "Customizing the TCF Banner – Do’s and Don’ts",
			link: "https://complianz.link/vilss48"
		},
		{
			content: "Translate your cookie notice and legal documents",
			link: "https://complianz.link/ceB95Tx"
		},
		{
			content: "Debugging issues with Complianz",
			link: "https://complianz.link/NAjPkE8"
		}
	];


    return (
        <div className="cmplz-tips-tricks-container tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-[var(--cmplz-space-s,_12px)]">
            {items.map((item, i) => <Tip key={"trick-"+i} link={item.link} content={item.content} /> ) }
        </div>
    );

}
export default TipsTricks
