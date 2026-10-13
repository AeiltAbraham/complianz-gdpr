import { __ } from '@wordpress/i18n';
import useDocuments from "./DocumentsData";
const SingleDocument = ({document, index}) => {
	const {region } = useDocuments();
	let regions = document.regions.filter( (docRegion) => docRegion !== region);

	return (

		<div key={index} className="cmplz-single-document-other-regions tw-flex tw-items-center tw-gap-[var(--cmplz-space-xs,_8px)] tw-py-[var(--cmplz-space-xs,_8px)] tw-px-[var(--cmplz-space-l,_24px)]">
			<a className="tw-flex-1" href={document.readmore} target="_blank" rel="noopener noreferrer">{document.title}</a>
				{ regions.map( (region, i)=>
					<div key={i} className="cmplz-region-indicator">
						<img alt={region} width="16px" height="16px" src={cmplz_settings.plugin_url + "/assets/images/"+region+".svg"} />
					</div>
				 )}
		</div>

	);
}
const OtherRegions = () => {
	const documents = [
		{
			id: 'privacy-statement',
			title: "Privacy Statements",
			regions: ['eu', 'us', 'uk', 'ca', 'za', 'au', 'br'],
			readmore: 'https://complianz.io/definition/what-is-a-privacy-statement/',
		},
		{
			id: 'cookie-statement',
			title: "Cookie Policy",
			regions: ['eu', 'us', 'uk', 'ca', 'za', 'au', 'br'],
			readmore: ' https://complianz.io/definition/what-is-a-cookie-policy/',
		},
		{
			id: 'impressum',
			title: "Impressum",
			regions: ['eu'],
			readmore: 'https://complianz.io/definition/what-is-an-impressum/',
		},
		{
			id: 'do-not-sell-my-info',
			title: "Opt-out preferences",
			regions: ['us'],
			readmore: 'https://complianz.io/definition/what-is-do-not-sell-my-personal-information/',
		},
		{
			id: 'privacy-statement-for-children',
			title: "Privacy Statement for Children",
			regions: ['us', 'uk', 'ca', 'za', 'au', 'br'],
			readmore: 'https://complianz.io/definition/what-is-a-privacy-statement-for-children/',
		}
	]


	return (
		<>
			<div className="cmplz-document-header tw-flex tw-justify-between tw-items-center tw-mt-[var(--cmplz-space-l,_24px)] tw-mb-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-l,_24px)]">
				<h3 className="cmplz-h4 tw-m-0">{__("Other regions")}</h3><a className="tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-text-[color:var(--cmplz-text-muted,_#475569)]" href="https://complianz.io/features/" target="_blank" rel="noopener noreferrer">{__("Read more","complianz-gdpr")}</a>
			</div>
			{ documents.map( (document, i)=> <SingleDocument key={i} index={i} document={document}/> )}
		</>

	)
}
export default OtherRegions;
